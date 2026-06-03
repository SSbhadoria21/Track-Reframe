import { Extension, Node, mergeAttributes } from '@tiptap/core'

export type ElementType = 'scene-heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot' | 'general';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    screenplay: {
      setScreenplayElement: (type: ElementType) => ReturnType,
    }
    pageBreak: {
      setPageBreak: () => ReturnType,
    }
  }
}

export const PageBreak = Node.create({
  name: 'pageBreak',
  group: 'block',
  selectable: true,
  draggable: true,

  parseHTML() {
    return [{ tag: 'hr[data-type="page-break"]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(HTMLAttributes, { 'data-type': 'page-break', class: 'page-break' })]
  },

  addCommands() {
    return {
      setPageBreak: () => ({ chain }) => {
        return chain().insertContent({ type: this.name }).run()
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
})

export const ScreenplayExtension = Extension.create({
  name: 'screenplay',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          screenplayType: {
            default: 'action',
            parseHTML: element => element.getAttribute('data-screenplay-type') || 'action',
            renderHTML: attributes => {
              return {
                'data-screenplay-type': attributes.screenplayType,
                class: `sp-${attributes.screenplayType}`
              }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setScreenplayElement: (type: ElementType) => ({ commands }) => {
        return commands.updateAttributes('paragraph', { screenplayType: type })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-1': () => this.editor.commands.setScreenplayElement('scene-heading'),
      'Mod-2': () => this.editor.commands.setScreenplayElement('action'),
      'Mod-3': () => this.editor.commands.setScreenplayElement('character'),
      'Mod-4': () => this.editor.commands.setScreenplayElement('dialogue'),
      'Mod-5': () => this.editor.commands.setScreenplayElement('parenthetical'),
      'Mod-6': () => this.editor.commands.setScreenplayElement('transition'),
      'Mod-7': () => this.editor.commands.setScreenplayElement('shot'),
      'Mod-8': () => this.editor.commands.setScreenplayElement('general'),
      'Enter': () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        const node = $from.node();
        const type = node.attrs.screenplayType;

        let handled = false;

        if (type === 'scene-heading' || type === 'shot' || type === 'transition') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('action');
          handled = true;
        } else if (type === 'character') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('dialogue');
          handled = true;
        } else if (type === 'dialogue') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('action');
          handled = true;
        } else if (type === 'parenthetical') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('dialogue');
          handled = true;
        }

        // Auto-pagination check
        setTimeout(() => {
          try {
            const currentPos = this.editor.state.selection.$from.pos;
            
            // Find the position of the last pageBreak before the cursor
            let lastPageBreakPos = 0;
            this.editor.state.doc.nodesBetween(0, currentPos, (node, pos) => {
              if (node.type.name === 'pageBreak') {
                lastPageBreakPos = pos;
              }
            });
            
            // Calculate height of text since last page break
            const domRect = this.editor.view.dom.getBoundingClientRect();
            let pageTopY = domRect.top + 96; // 96 is padding-top of .ProseMirror
            
            if (lastPageBreakPos > 0) {
              // Get Y pos of paragraph immediately following the page break (leaf node size is 1)
              const afterPbCoords = this.editor.view.coordsAtPos(lastPageBreakPos + 1);
              pageTopY = afterPbCoords.top;
            }
            
            const currentCoords = this.editor.view.coordsAtPos(currentPos);
            const textHeight = currentCoords.top - pageTopY;
            
            // If text exceeds ~850px (near the 864px max text height of US Letter)
            if (textHeight > 850) {
              // Check if an old page break was pushed down nearby (within 500 characters)
              let nextPbPos = -1;
              this.editor.state.doc.nodesBetween(currentPos, Math.min(currentPos + 500, this.editor.state.doc.content.size), (node, pos) => {
                if (node.type.name === 'pageBreak' && nextPbPos === -1) {
                  nextPbPos = pos;
                }
              });

              // Delete the old lingering page break to prevent duplicates
              if (nextPbPos !== -1) {
                this.editor.chain().deleteRange({ from: nextPbPos, to: nextPbPos + 1 }).run();
              }

              // Insert the new page break at the correct boundary
              this.editor.chain().focus().insertContentAt(currentPos - 1, { type: 'pageBreak' }).run();
            }
          } catch(e) {}
        }, 10);

        return handled;
      },
      'Tab': () => {
        const { selection } = this.editor.state;
        const { $from } = selection;
        const node = $from.node();
        const type = node.attrs.screenplayType;

        let nextType: ElementType = 'scene-heading';
        if (type === 'scene-heading') nextType = 'action';
        else if (type === 'action') nextType = 'character';
        else if (type === 'character') nextType = 'dialogue';
        else if (type === 'dialogue') nextType = 'parenthetical';
        else if (type === 'parenthetical') nextType = 'transition';
        else if (type === 'transition') nextType = 'scene-heading';

        this.editor.commands.setScreenplayElement(nextType);
        return true;
      }
    }
  },
})
