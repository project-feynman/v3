<template>
  <div class="editor">
    <editor-menu-bar v-if="isEditable" :editor="editor" v-slot="{ commands, isActive }">
      <div class="menubar">
        <v-btn @click="commands.bold" icon> 
          <v-icon>format_bold</v-icon>
        </v-btn>
        <v-btn @click="commands.italic" :class="{ 'is-active': isActive.italic() }" icon> 
          <v-icon>format_italic</v-icon>
        </v-btn>
        <!-- TODO: make it visible to the user that the option is currently selected -->
        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.code_block() }"
          @click="commands.code_block"
        >
          <v-icon>code</v-icon>
        </button>
        <button
          class="menubar__button"
          :class="{ 'is-active': isActive.heading({ level: 2 }) }"
          @click="commands.heading({ level: 2 })"
        >
          <v-icon>title</v-icon>
        </button>
        <!-- <v-btn @click="showImagePopup(commands.image)"></v-btn>

        <ButtonPrabhakar @click="$refs.fileInput.click()" :isSuperSmallText="true" outlined icon="image">
          <input style="display: none" type="file" @change="e => onImageSelected(e, commands.image)" ref="fileInput">
          <p>{{ imageAdded? "Change" : "Add" }} IMAGE<br> (CTRL + V)</p>
        </ButtonPrabhakar> -->

      </div>
    </editor-menu-bar>

    <editor-content class="editor__content" :editor="editor"/>
  </div>
</template>

<script>
import { Editor, EditorContent, EditorMenuBar } from 'tiptap';
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
import ButtonPrabhakar from "@/components/ButtonPrabhakar.vue";

const defaultHtml = `
   
          <p>
            "If you can't explain it simply, you don't understand it well enough" - <em>Albert Einstein</em> 
          </p>
          <b>Try editing text:</b>
          <ul>
            <li>
              <pre><code>x = [0 for i in range(n)] // code blocks are supported </code></pre>
            </li>
            <li>
              Latex and images will be supported soon
            </li>
          </ul>
        
        `
// <img src="https://d384u2mq2suvbq.cloudfront.net/public/spree/products/1597/jumbo/Japanese-Cherry-Blossom-Fragrance-Oil.jpg?1529607178" />

export default {
  components: { EditorContent, EditorMenuBar, ButtonPrabhakar },
  props: {
    injectedHtml: String,
    isEditable: {
      type: Boolean,
      default () { return true; }
    } 
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
          new Placeholder({
            emptyEditorClass: 'is-editor-empty',
            emptyNodeClass: 'is-empty',
            emptyNodeText: 'Write something …',
            showOnlyWhenEditable: true,
            showOnlyCurrent: true,
          }),
        ],
        content: defaultHtml,
        onUpdate: ({ getHTML }) => {
          this.html = getHTML();
        }
      }),
      html: defaultHtml
    }
  },
  watch: {
    injectedHtml: {
      handler: "setContent",
      immediate: true
    },
    isEditable: {
      handler: "updateEditableStatus",
      immediate: true
    }
  },
  beforeDestroy() {
    this.editor.destroy()
  },
  created () {
    this.editor.focus();
  },
  methods: {
    setContent () {
      if (!this.injectedHtml) { return; }
      this.editor.setContent(this.injectedHtml);
      this.editor.focus();
    },
    updateEditableStatus () {
      this.editor.setOptions({
        editable: this.isEditable
      });
    },
    extractAllText () {
      const temporaryDiv = document.createElement("div");
      temporaryDiv.innerHTML = this.html;
      return temporaryDiv.textContent || temporaryDiv.innerText || "";
    }
    // onImageSelected (e, command) {
    //   const imageFile = e.target.files[0];
    //   this.$emit("image-selected", imageFile);
    //   console.log("imageFile =", imageFile);
    //   const imageUrl = URL.createObjectURL(imageFile);
    //   console.log("imageUrl =", imageUrl);
    //   command({ src: imageUrl });
    // }
  }
}
</script>