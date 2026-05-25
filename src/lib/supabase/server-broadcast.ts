import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function broadcastNotification(channelName: string, payload: any) {
  return new Promise((resolve) => {
    const channel = supabaseAdmin.channel(channelName, {
      config: { broadcast: { ack: true } }
    });
    
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const resp = await channel.send({
          type: 'broadcast',
          event: 'new_notification',
          payload: payload
        });
        
        // Wait a tiny bit to ensure network flush even with ack
        setTimeout(async () => {
          await supabaseAdmin.removeChannel(channel);
          resolve(true);
        }, 500);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        resolve(false);
      }
    });
    
    // Timeout fallback just in case
    setTimeout(() => {
      resolve(false);
    }, 5000);
  });
}
