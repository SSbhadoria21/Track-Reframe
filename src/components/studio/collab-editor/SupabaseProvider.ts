import * as Y from 'yjs';
import * as awarenessProtocol from 'y-protocols/awareness';
import { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export class SupabaseProvider {
  public awareness: awarenessProtocol.Awareness;
  public channel: RealtimeChannel;
  public doc: Y.Doc;
  public synced: boolean = false;
  
  private updateHandler: (update: Uint8Array, origin: any) => void;
  private awarenessHandler: (changes: any, origin: any) => void;

  constructor(doc: Y.Doc, supabase: SupabaseClient, roomName: string) {
    this.doc = doc;
    this.awareness = new awarenessProtocol.Awareness(doc);
    this.channel = supabase.channel(`yjs-${roomName}`, {
      config: {
        broadcast: { ack: false }
      }
    });

    // 1. Listen for local Yjs updates and broadcast them
    this.updateHandler = (update: Uint8Array, origin: any) => {
      if (origin !== this) {
        this.channel.send({
          type: 'broadcast',
          event: 'yjs-update',
          payload: { update: Array.from(update) }
        });
      }
    };
    this.doc.on('update', this.updateHandler);

    // 2. Listen for local Awareness updates and broadcast them
    this.awarenessHandler = ({ added, updated, removed }: any, origin: any) => {
      if (origin !== this) {
        const changedClients = added.concat(updated).concat(removed);
        const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changedClients);
        this.channel.send({
          type: 'broadcast',
          event: 'yjs-awareness',
          payload: { update: Array.from(update) }
        });
      }
    };
    this.awareness.on('update', this.awarenessHandler);

    // 3. Receive Remote Yjs updates
    this.channel.on('broadcast', { event: 'yjs-update' }, ({ payload }) => {
      try {
        const update = new Uint8Array(payload.update);
        Y.applyUpdate(this.doc, update, this);
      } catch (e) {
        console.error('Failed to apply Yjs update', e);
      }
    });

    // 4. Receive Remote Awareness updates
    this.channel.on('broadcast', { event: 'yjs-awareness' }, ({ payload }) => {
      try {
        const update = new Uint8Array(payload.update);
        awarenessProtocol.applyAwarenessUpdate(this.awareness, update, this);
      } catch (e) {
        console.error('Failed to apply awareness update', e);
      }
    });

    // 4a. Handle awareness requests from new peers
    this.channel.on('broadcast', { event: 'request-awareness' }, () => {
      const state = awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
      this.channel.send({
        type: 'broadcast',
        event: 'yjs-awareness',
        payload: { update: Array.from(state) }
      });
    });

    // 4b. Handle sync requests from new peers
    this.channel.on('broadcast', { event: 'request-sync' }, ({ payload }) => {
      try {
        const stateVector = payload.stateVector ? new Uint8Array(payload.stateVector) : undefined;
        const update = Y.encodeStateAsUpdate(this.doc, stateVector);
        this.channel.send({
          type: 'broadcast',
          event: 'yjs-update',
          payload: { update: Array.from(update) }
        });
      } catch (e) {
        console.error('Failed to encode sync update', e);
      }
    });

    // 5. Connect and broadcast initial state
    this.channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        this.synced = true;
        // Trigger a fake synced event so our UI knows we connected
        if ((this as any).onSynced) (this as any).onSynced({ synced: true });

        // Broadcast local awareness state to others
        const state = awarenessProtocol.encodeAwarenessUpdate(this.awareness, [this.doc.clientID]);
        this.channel.send({
          type: 'broadcast',
          event: 'yjs-awareness',
          payload: { update: Array.from(state) }
        });

        // Request awareness from others so we know who is already in the room
        this.channel.send({
          type: 'broadcast',
          event: 'request-awareness'
        });

        // Request document sync from others to get any unsaved changes
        const stateVector = Y.encodeStateVector(this.doc);
        this.channel.send({
          type: 'broadcast',
          event: 'request-sync',
          payload: { stateVector: Array.from(stateVector) }
        });
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.synced = false;
        if ((this as any).onSynced) (this as any).onSynced({ synced: false });
      }
    });
  }

  // Helper for our UI to hook into connection status
  public on(event: string, callback: any) {
    if (event === 'synced') {
      (this as any).onSynced = callback;
      callback({ synced: this.synced });
    }
  }

  public off(event: string, callback: any) {
    if (event === 'synced') {
      (this as any).onSynced = null;
    }
  }

  public destroy() {
    this.doc.off('update', this.updateHandler);
    this.awareness.off('update', this.awarenessHandler);
    this.channel.unsubscribe();
  }
}
