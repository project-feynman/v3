<template>
  <v-app-bar :height="navbarHeight" :color="isRealtime?'#fff':'#eee'" :elevation="isRealtime ? 0 : 1" class="blackboard-toolbar">
    <v-container fluid class="px-0">
      <v-row align="center" justify="space-between">
        <template v-if="currentState !== RecordState.POST_RECORD">
          <v-col class="py-0">
            <v-row justify="start" align="center">
              <v-col class="px-1 py-0" cols="auto">
                <div :class="[$vuetify.breakpoint.smAndDown ? 'dropdown ':'', palleteVisibility? 'active ':'', 'd-flex',]"
                  id="swatches-wrapper"
                  @click="$emit('tool-select', { tool: BlackboardTools.PEN })"
                >
                  <v-btn
                    :color="(!$vuetify.breakpoint.smAndDown || palleteVisibility || isPen)? 'accent' : color"
                    @click="palleteClick()"
                    :outlined="isPen? false:true"
                    min-width="36px"
                    class="px-3"
                    height="38px"
                    max-width="64px"
                  >
                    <v-icon>mdi-lead-pencil</v-icon>
                    <v-icon class="down">mdi-chevron-down</v-icon>
                  </v-btn>
                  <swatches @input="newColor => $emit('tool-select', { tool: BlackboardTools.PEN, color: newColor })"
                    :value="color"
                    :colors="colors"
                    :show-border="true"
                    :wrapper-style="{ padding:'0px', maxHeight:'26px', display:'flex'}"
                    :swatch-style="{ margin:'0 5px', borderRadius:'50%' }"
                    inline
                    background-color="rgba(0, 0, 0, 0)"
                    swatch-size="24"
                  />
                </div>
              </v-col>
              <ButtonNew @click="selectNormalEraser()" 
                :filled="isNormalEraser" icon="mdi-eraser"
              >
                Eraser
              </ButtonNew>
              <ButtonNew @click="$emit('tool-select', { tool: BlackboardTools.STROKE_ERASER })" 
                :filled="isStrokeEraser" icon="mdi-eraser"
              >
                Stroke Eraser
              </ButtonNew>
            </v-row>
          </v-col>
        </template>
          <template v-if="currentState === RecordState.PRE_RECORD">
            <slot name="initial-buttons">

            </slot>
            <v-col class="py-0 px-0" cols="auto">
              <ButtonNew @click="$refs.fileInput.click()" :filled="imageAdded && !blackboardAttached" icon="mdi-image">
                <input style="display: none" type="file" @change="(e) => onImageSelected(e)" ref="fileInput">
                {{ imageAdded? "Change" : "Add" }} Background
              </ButtonNew>
            </v-col>
            <v-col class="py-0 px-0" cols="auto">
              <BasePopupButton actionName="Wipe board"
                @action-do="$emit('wipe-board')"
              >
                <template v-slot:activator-button="{ on }">
                  <ButtonNew v-on="on" icon="mdi-delete">
                    Wipe Board
                  </ButtonNew>
                </template>
                <template v-slot:message-to-user>
                  Are you sure you want to wipe everything?
                </template>
              </BasePopupButton>
            </v-col>
            <v-col cols="auto" class="py-0 px-0">
              <ButtonNew @click="$emit('record-state-change', RecordState.MID_RECORD)" :filled="true" icon="mdi-adjust">
                Record
              </ButtonNew>
            </v-col>
          </template>

          <template v-else-if="currentState === RecordState.MID_RECORD">
            <v-col class="py-0 px-0" cols="auto">
              <ButtonPrabhakar @click="$emit('record-state-change', RecordState.POST_RECORD)">
                Stop
              </ButtonPrabhakar>
            </v-col>
          </template>

        <template v-else>
          <v-col class="py-0 px-0" cols="auto">
            <!-- <ButtonPrabhakar @click="$emit('record-state-change', RecordState.PRE_RECORD)" outlined icon="mdi-undo-variant">
              Retry
            </ButtonPrabhakar> -->
          </v-col>
          <!-- TODO: give ability to preview -->
          <slot>

          </slot>
        </template>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>
import "vue-swatches/dist/vue-swatches.min.css";
import Swatches from "vue-swatches";
import { RecordState, BlackboardTools, navbarHeight } from "@/CONSTANTS.js";
import ButtonPrabhakar from "@/components/ButtonPrabhakar.vue";
import BasePopupButton from "@/components/BasePopupButton.vue";
import ButtonNew from "@/components/ButtonNew.vue";

export default {
  props: {
    currentTool: String,
    color: String,
    currentState: String,
    isRealtime: Boolean,
  },
  components: { 
    Swatches, 
    ButtonPrabhakar,
    BasePopupButton,
    ButtonNew,
  },
  data () {
    return {
      RecordState,
      BlackboardTools,
      navbarHeight,
      colors: ["white", "orange", "#0AF2F2", "#ec1bf7"],
      palleteVisibility: false,
      imageAdded: false,
      blackboardAttached: true
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
    onImageSelected (e) {
      this.$emit("image-selected", e.target.files[0]);
    },
    setImage () {
      document.getElementById("whiteboard-bg-input").value = "";
      document.getElementById("whiteboard-bg-input").click();
    },
    selectNormalEraser () {
      this.palleteVisibility = false;
      this.$emit('tool-select', { tool: BlackboardTools.NORMAL_ERASER })
    },
    palleteClick () {
      if (!this.isPen) { 
        this.palleteVisibility = false; 
      } else { 
        this.palleteVisibility = !this.palleteVisibility; 
      }
    },
    palleteClose (e) {
      const pallete = document.getElementById("swatches-wrapper");
      if (pallete && !pallete.contains(e.target)) {
        this.palleteVisibility = false;
      }
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