<template>
  <div class="editor">
    <editor-menu-bar :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <v-btn @click="showImage = !showImage" icon>
          <v-icon>mdi-image</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.bold() }" @click="commands.bold" icon>
          <v-icon>mdi-format-bold</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.italic() }" @click="commands.italic" icon>
          <v-icon>mdi-format-italic</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.strike() }" @click="commands.strike" icon>
          <v-icon>mdi-format-strikethrough-variant</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.underline() }" @click="commands.underline" icon>
          <v-icon>mdi-format-underline</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.paragraph() }" @click="commands.paragraph" icon>
          <v-icon>mdi-view-headline</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.heading({ level: 1 }) }" @click="commands.heading({ level: 1 })" icon>
          H1
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.heading({ level: 2 }) }" @click="commands.heading({ level: 2 })" icon>
          H2
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.heading({ level: 3 }) }" @click="commands.heading({ level: 3 })" icon>
          H3
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.bullet_list() }" @click="commands.bullet_list" icon>
          <v-icon>mdi-format-list-bulleted</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.ordered_list() }" @click="commands.ordered_list" icon>
          <v-icon>mdi-format-list-numbered</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.todo_list() }"  @click="commands.todo_list" icon>
          <v-icon>mdi-format-list-checks</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.blockquote() }" @click="commands.blockquote" icon>
          <v-icon>mdi-comment-quote-outline</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.code() }" @click="commands.code" icon>
          <v-icon>mdi-code-tags</v-icon>
        </v-btn>
        <v-btn :class="{ 'is-active': isActive.code_block() }" @click="commands.code_block" icon>
          <v-icon>mdi-code-array</v-icon>
        </v-btn>
        <v-btn @click="commands.horizontal_rule" icon>
          <v-icon>mdi-window-minimize</v-icon>
        </v-btn>
        <v-btn @click="commands.undo" icon>
          <v-icon>mdi-undo</v-icon>
        </v-btn>
        <v-btn @click="commands.redo" icon>
          <v-icon>mdi-redo</v-icon>
        </v-btn>

        <!-- insert image -->
        <div v-if="showImage">
          <form @submit.prevent>
            <v-icon>mdi-link</v-icon>
            <input @keydown.enter.prevent="insertImage(commands.image)" class="white-text" placeholder="Enter image url here" type="text" v-model="imageURL"/>
          </form>
        </div>

<!-- TODO: make it visible to the user that the option is currently selected
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
        -->
      </div>
    </editor-menu-bar>

    <editor-content class="editor__content" :editor="editor" data-qa="text-editor"/>
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
      showImage: false,
      imageURL: "",
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
    },
    insertImage(commands) {
      let src = this.imageURL
      if (src !== null) {
        commands({ src })
        this.showImage = false
        this.imageURL = null
      }
    },
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