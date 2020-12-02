<template>
  <!-- 605 works for the iPhone, which for some reason requires a higher min-width -->
  <v-app-bar width="600" min-width="600" elevation="5" :height="toolbarHeight" color="grey darken-1" fixed style="margin-left: auto; margin-right: 0;" rounded>
    <v-container fluid class="px-0 py-0">
      <v-row align="center">
        <BaseButton @click="$store.commit('SET_IS_BOARD_FULLSCREEN', !isBoardFullscreen)" 
          :icon="isBoardFullscreen ? 'mdi-arrow-expand-right' : 'mdi-arrow-collapse-left'" color="white"
        >
          {{ isBoardFullscreen ? 'Show' : 'Hide' }} drawer
        </BaseButton>
        
        <slot name="record-audio-slot">

        </slot>

        <v-col class="py-0 px-0" cols="auto">
          <PenSwatch 	
            :colors="colors" 	
            :isPenActive="isPen"	
            @select-color="newColor => selectPen(newColor)" 	
          />
        </v-col>

        <BaseButton :color="isNormalEraser ? 'white' : 'white'" :filled="isNormalEraser" small @click="selectNormalEraser()" icon="mdi-eraser-variant">
          Eraser
        </BaseButton>

        <slot name="touch-slot">

        </slot>

        <v-spacer/>

        <slot name="more-actions-slot">

        </slot>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>
import "vue-swatches/dist/vue-swatches.min.css";
import Swatches from "vue-swatches";
import { BlackboardTools, toolbarHeight, ERASER_STROKE_WIDTH } from "@/CONSTANTS.js";
import BasePopupButton from "@/components/BasePopupButton.vue";
import BaseButton from "@/components/BaseButton.vue";
import PenSwatch from "@/components/BlackboardToolBarPenSwatch.vue";
import ColorPicker from "@/components/ColorPicker.vue";

export default {
  props: {
    currentTool: String,
    isFullScreen: Boolean
  },
  components: { 
    Swatches, 
    BasePopupButton,
    BaseButton,
    PenSwatch,
    ColorPicker
  },
  data () {
    return {
      BlackboardTools,
      toolbarHeight,
      colors: [
        "cyan", 
        "white", 
        "orange", 
        "#FF54F1"
      ],
      colorPaletteExpanded: false,
      lastEraserNormal: true
    }
  },
  computed: {
    isBoardFullscreen () {
      return this.$store.state.isBoardFullscreen;
    },
    isStrokeEraser () {
      return this.currentTool === BlackboardTools.STROKE_ERASER;
    },
    isNormalEraser () {
      return this.currentTool === BlackboardTools.NORMAL_ERASER; 
    },
    isPen () {
      return this.currentTool === BlackboardTools.PEN; 
    }
  },
  mounted () {
    window.addEventListener("click", e => this.palleteClose(e), false);
    window.addEventListener("touchstart", e => this.palleteClose(e));
    // this.selectPen("cyan");
  },
  destroyed () {
    window.removeEventListener("click", e => this.palleteClose(e));
    window.removeEventListener("touchstart", e => this.palleteClose(e));
  },
  methods: {
    selectPen (newColor) {
      this.$emit("tool-select", {
        type: BlackboardTools.PEN,
        color: newColor,
        lineWidth: 2
      });
    },
    selectNormalEraser () {
      this.lastEraserNormal = true;
      this.colorPaletteExpanded = false;
      this.$emit('tool-select', { 
        type: BlackboardTools.NORMAL_ERASER,
        color: "cyan", // this doesn't actually do anything
        lineWidth: ERASER_STROKE_WIDTH
      });
    },
    selectStrokeEraser () {
      this.lastEraserNormal = false;
      this.$emit('tool-select', { 
        type: BlackboardTools.STROKE_ERASER,
        color: "cyan", // doesn't do anything and is ignored
        lineWidth: 5
      });
    },
    palleteClick () {
      if (!this.isPen) { 
        this.colorPaletteExpanded = false; 
      } else { 
        this.colorPaletteExpanded = !this.colorPaletteExpanded; 
      }
    },
    palleteClose (e) {
      const pallete = document.getElementById("swatches-wrapper");
      if (pallete && !pallete.contains(e.target)) {
        this.colorPaletteExpanded = false;
      }
    },
    fullScreen () {
      this.$emit('toggle-fullScreen');
    },
    // TODO: open a popup, THEN allow the copy and pasting of images
    initCopyAndPasteImage () {
      //  document.onpaste = async (event) => {
      //   const items = (event.clipboardData || event.originalEvent.clipboardData).items; // use event.originalEvent.clipboard for newer chrome versions
      //   // Find pasted image among pasted items
      //   let blob = null;
      //   for (let i = 0; i < items.length; i++) {
      //     if (items[i].type.indexOf("image") === 0) {
      //       blob = items[i].getAsFile();
      //     }
      //   }
      //   // Load image if there is a pasted image
      //   if (blob === null) { return; }
      //   this.imageBlob = blob;
      //   if (!this.isRealtime) {
      //     const imageUrl = URL.createObjectURL(this.imageBlob);
      //     this.displayImageAsBackground(imageUrl);
      //   } else {
      //     const imageUrl = await this.$_saveToStorage(`images/${this.blackboardId}`, blob);
      //     this.blackboardRef.update({ imageUrl });
      //     this.imageUrl = imageUrl; // store locally
      //   }     
      // }
    }
  }
};
</script>

<style>
@media (min-width: 600px) and (max-width: 670px),
  (min-width: 1264px) and (max-width: 1300px) {
  .blackboard-toolbar {
    zoom: 0.95;
  }
}
@media (max-width: 350px), (min-width: 960px) and (max-width: 1050px) {
  .blackboard-toolbar {
    zoom: 0.9;
  }
}
#swatches-wrapper {
  position: relative;
}
#swatches-wrapper .vue-swatches {
  border: 1px solid #f03c02;
  border-radius: 0 10px 10px 0;
}
#swatches-wrapper button {
  border-radius: 9px 0 0 9px;
  border: 1px solid #f03c02 !important;
}
#swatches-wrapper button .v-icon.down {
  display: none;
}
#swatches-wrapper.dropdown button {
  border-radius: 10px;
  left: 0;
  padding: 0 8px;
}
#swatches-wrapper.dropdown button .v-icon {
  display: block;
}
#swatches-wrapper.dropdown .vue-swatches {
  display: none;
}
#swatches-wrapper.dropdown.active > * {
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.25);
}
#swatches-wrapper.dropdown.active button {
  border-radius: 10px 10px 0 0;
}
#swatches-wrapper.dropdown.active .vue-swatches {
  display: block;
  position: absolute;
  top: 38px;
  left: 0;
  background: white;
  border-radius: 0 10px 10px 10px;
}
button {
  min-width: 36px !important;
}
.board-action-btn {
  margin: 0 5px;
}
.board-action-btn .v-icon {
  margin: 0 -6px;
}
.v-icon {
  font-size: 20px;
}

/* TODO: CSS leak */
.super-small-text p {
  font-size: 0.6em;
  margin-bottom: 0;
}
</style>