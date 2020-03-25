<template>
  <v-app-bar :height="navbarHeight" :color="'#eee'" :elevation="1" class="blackboard-toolbar">
    <v-container fluid class="px-0">
      <v-row align="center" justify="space-between">
        <v-col class="py-0">
          <v-row justify="start" align="center">
            <v-col class="px-1 py-0" cols="auto">
              <!-- <div 
                :class="[$vuetify.breakpoint.smAndDown ? 'dropdown ':'', colorPaletteExpanded ? 'active ':'', 'd-flex',]"
                id="swatches-wrapper"
                @click.self="$emit('tool-select', { tool: BlackboardTools.PEN, color: 'white' })"
              > -->
                <!-- <v-btn
                  :color="(!$vuetify.breakpoint.smAndDown || colorPaletteExpanded || isPen) ? 'accent' : color"
                  @click="palleteClick()"
                  :outlined="!isPen"
                  min-width="36px"
                  class="px-3"
                  height="38px"
                  max-width="64px"
                >
                  <v-icon>mdi-lead-pencil</v-icon>
                  <v-icon class="down">mdi-chevron-down</v-icon>
                </v-btn> -->
                <swatches 
                  @input="(newColor) => changePenColor(newColor)"
                  :value="color"
                  :colors="colors"
                  :show-border="true"
                  :wrapper-style="{ padding:'0px', maxHeight:'26px', display:'flex'}"
                  :swatch-style="{ margin:'0 5px', borderRadius:'50%' }"
                  inline
                  background-color="rgba(0, 0, 0, 0)"
                  swatch-size="24"
                />
              <!-- </div> -->
            </v-col>
            <ButtonNew :filled="isNormalEraser" @click="selectNormalEraser()" icon="mdi-eraser">
              Eraser
            </ButtonNew>
            <ButtonNew :filled="isStrokeEraser" @click="selectStrokeEraser()" icon="mdi-eraser">
              Stroke Eraser
            </ButtonNew>
            <BasePopupButton @action-do="$emit('wipe-board')" actionName="Reset board">
              <template v-slot:activator-button="{ on }">
                <ButtonNew v-on="on" icon="mdi-delete">
                  Wipe Board
                </ButtonNew>
              </template>
              <template v-slot:message-to-user>
                Are you sure you want to wipe everything?
              </template>
            </BasePopupButton>
          </v-row>
        </v-col>
        <ButtonNew @click="$refs.fileInput.click()" icon="mdi-image">
          <input 
            @change="(e) => $emit('image-select', e.target.files[0])" 
            style="display: none" 
            type="file" 
            ref="fileInput"
          >
          Add Background
        </ButtonNew>
        <slot>

        </slot>
        <ButtonNew @click="fullScreen()" :icon="isFullScreen ? 'mdi-fullscreen-exit' : 'mdi-fullscreen'">
          {{isFullScreen ? 'Exit ' : ''}}Full Screen
        </ButtonNew>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>
import "vue-swatches/dist/vue-swatches.min.css";
import Swatches from "vue-swatches";
import { BlackboardTools, navbarHeight } from "@/CONSTANTS.js";
import BasePopupButton from "@/components/BasePopupButton.vue";
import ButtonNew from "@/components/ButtonNew.vue";

export default {
  props: {
    currentTool: String,
    isFullScreen: Boolean,
  },
  components: { 
    Swatches, 
    BasePopupButton,
    ButtonNew
  },
  data () {
    return {
      BlackboardTools,
      navbarHeight,
      color: "white",
      colors: ["white", "orange", "#0AF2F2", "#ec1bf7"],
      colorPaletteExpanded: false
    }
  },
  computed: {
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
  },
  destroyed () {
    window.removeEventListener("click", e => this.palleteClose(e));
    window.removeEventListener("touchstart", e => this.palleteClose(e));
  },
  methods: {
    changePenColor (newColor) {
      this.color = newColor;
      this.$emit('tool-select', { 
        type: BlackboardTools.PEN, 
        color: newColor,
        lineWidth: 2.5
      });
    },
    selectNormalEraser () {
      this.colorPaletteExpanded = false;
      this.$emit('tool-select', { 
        type: BlackboardTools.NORMAL_ERASER,
        lineWidth: 25
      });
    },
    selectStrokeEraser () {
      this.$emit('tool-select', { 
        type: BlackboardTools.STROKE_ERASER,
        lineWidth: 4.5
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
      console.log('clicked', this.isFullScreen);
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