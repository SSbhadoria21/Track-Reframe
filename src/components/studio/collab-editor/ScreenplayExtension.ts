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

        if (type === 'scene-heading' || type === 'shot' || type === 'transition') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('action');
          return true;
        } else if (type === 'character') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('dialogue');
          return true;
        } else if (type === 'dialogue') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('action');
          return true;
        } else if (type === 'parenthetical') {
          this.editor.commands.splitBlock();
          this.editor.commands.setScreenplayElement('dialogue');
          return true;
        }
        return false;
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
