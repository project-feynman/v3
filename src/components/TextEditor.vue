<template>
  <div class="editor">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <v-btn @click="commands.bold" icon> 
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn @click="commands.italic" :class="{ 'is-active': isActive.italic() }" icon> 
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>

        <!-- TODO: make it visible to the user that the option is currently selected -->
        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <v-icon>mdi-code-tags</v-icon>
        </button>
        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          <v-icon>mdi-format-title</v-icon>
        </button>
      </div>
    </editor-menu-bar>

    <editor-content class="editor__content" :editor="editor"/>
    <!-- <v-btn @click="extractTitle()"/> -->
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar, Node } from 'tiptap';
import {
  Blockquote,
  CodeBlock,
  HardBreak,
  Heading,
  HorizontalRule,
  OrderedList,
  BulletList,
  ListItem,
  TodoItem,
  TodoList,
  Bold,
  Code,
  Italic,
  Link,
  Strike,
  Underline,
  History,
  Image,
  Placeholder
} from 'tiptap-extensions';

const defaultHtml = ``;

class Title extends Node {
  get name () {
    return "title";
  }

  get schema () {
    return {
      content: "inline*", 
      parseDOM: [{
        tag: "h1"
      }],
      toDOM: () => ["h1", 0]
    }
  }
}

export default {
  props: {
    injectedHtml: String
  },
  components: { 
    EditorContent, 
    EditorMenuBar
  },
  data () {
    return {
      editor: new Editor({
        extensions: [
          new Blockquote(),
          new BulletList(),
          new CodeBlock(),
          new HardBreak(),
          new Heading({ levels: [1, 2, 3] }),
          new HorizontalRule(),
          new ListItem(),
          new OrderedList(),
          new TodoItem(),
          new TodoList(),
          new Link(),
          new Bold(),
          new Code(),
          new Italic(),
          new Strike(),
          new Underline(),
          new History(),
          new Image(),
          new Title(),
          new Placeholder({
            emptyEditorClass: 'is-editor-empty',
            emptyNodeClass: 'is-empty',
            emptyNodeText: node => 'Type here...',
            showOnlyWhenEditable: true,
            showOnlyCurrent: false,
          }),
        ],
        // content: defaultHtml,
        onUpdate: ({ getHTML }) => {
          this.html = getHTML();
          this.$emit("update:html", this.html);
        }
      }),
      content: defaultHtml,
      html: defaultHtml,
    }
  },
  watch: {
    injectedHtml: {
      handler: "setup",
      immediate: true
    }
  },
  beforeDestroy() {
    this.editor.destroy()
  },
  methods: {
    setup () {
      if (this.injectedHtml) {
        this.html = this.injectedHtml;
        this.editor.setContent(this.injectedHtml);
      }
      this.editor.focus();
    },
    extractAllText () {
      const temporaryDiv = document.createElement("div");
      temporaryDiv.innerHTML = this.html;
      return temporaryDiv.textContent || temporaryDiv.innerText || "";
    },
    extractTitle () {
      const temporaryDiv = document.createElement("div");
      temporaryDiv.innerHTML = this.html;
      let output = ""
      for (let child of temporaryDiv.children){
        output += child.textContent || child.innerText || "";
        // if (child !== temporaryDiv.lastChild) {
          output += "\n";
        // }
      }
      console.log(output)
      return output;
    }
  }
}
</script>

<style lang="scss">
.editor p.is-editor-empty:first-child::before {
  content: attr(data-empty-text);
  float: left;
  color: #aaa;
  pointer-events: none;
  height: 0;
  font-style: italic;
}
</style>