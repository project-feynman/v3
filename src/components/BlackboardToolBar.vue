<template>
  <v-app-bar
    dense
    :color="isRealtime?'#fff':'#eee'"
    :elevation="isRealtime?0:1"
    class="blackboard-toolbar"
  >
    <v-container class="py-1 px-0">
      <v-row align="center" justify="space-between">
        <template v-if="currentState !== recordStateEnum.POST_RECORD">
          <v-col class="py-0">
            <v-row justify="start" align="center">
              <v-col class="px-1 py-0" cols="auto">
                <div
                  :class="[isSmallScreen? 'dropdown ':'', palleteVisibility? 'active ':'', 'd-flex',]"
                  id="swatches-wrapper"
                  @click="$emit('eraser-click',false)"
                >
                  <v-btn
                    :color="(!isSmallScreen || palleteVisibility || eraserActive)? 'accent lighten-1':color"
                    @click="palleteClick()"
                    :outlined="eraserActive? true:false"
                    min-width="36px"
                    class="px-3"
                    height="38px"
                    max-width="64px"
                  >
                    <v-icon>mdi-lead-pencil</v-icon>
                    <v-icon class="down">keyboard_arrow_down</v-icon>
                  </v-btn>
                  <swatches
                    @input="newVal => $emit('color-click', newVal)"
                    :value="color"
                    :colors="colors"
                    :show-border="true"
                    :wrapper-style="{ padding:'0px', maxHeight:'26px', display:'flex' }"
                    :swatch-style="{margin:'0 5px', borderRadius:'50%'}"
                    inline
                    background-color="rgba(0, 0, 0, 0)"
                    swatch-size="26"
                  />
                </div>
              </v-col>
              <v-col class="py-0 px-0" cols="auto">
                <v-btn
                  :value="eraserActive"
                  @click="eraserClick"
                  :outlined="eraserActive? false : true"
                  color="accent lighten-1"
                  class="board-action-btn normal-text"
                >
                  <span class="d-none d-md-block mr-2">
                    Eraser
                  </span>
                  <v-icon>mdi-eraser</v-icon>
                </v-btn>
              </v-col>
              <v-col class="py-0 px-0" cols="auto">
                <!-- <v-btn
                  @click="setImage()"
                  ref="background"
                  outlined
                  color="accent lighten-1"
                  class="board-action-btn normal-text"
                >
                  <span class="d-none d-md-block mr-2">Background</span>
                  <v-icon>image</v-icon>
                  <input
                    @change="event=>$emit('set-image',event)"
                    id="whiteboard-bg-input"
                    name="whiteboard-bg"
                    type="file"
                    style="display: none;"
                  />
                </v-btn> -->
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="auto" class="py-0 px-0">
            <!-- TODO: do a confirmation popup -->
            <!-- <v-btn
              @click="$emit('wipe-board')"
              outlined
              color="accent"
              class="board-action-btn normal-text"
            >
              <span class="d-none d-lg-block mr-2">
                Wipe blackboard
              </span>
              <v-icon>clear</v-icon>
            </v-btn> -->
            

            <v-btn 
              v-if="currentState === recordStateEnum.PRE_RECORD"
              @click="$emit('wipe-board')" 
              class="button-with-icon-and-text" outlined color="accent"
            >
              <p>WIPE & RESET<br>BLACKBOARD</p>
              <v-icon>delete_outline</v-icon>
            </v-btn>
           
            <v-btn 
              v-if="currentState === recordStateEnum.PRE_RECORD"
              @click="$emit('animation-save')" 
              class="button-with-icon-and-text" outlined color="accent"
            >
              <p>SAVE AS<br>ANIMATION</p>
              <v-icon>save</v-icon>
            </v-btn>

            <v-btn
              v-if="currentState === recordStateEnum.MID_RECORD"
              @click="$emit('record-state-change', recordStateEnum.POST_RECORD)"
              color="accent lighten-1"
              class="board-action-btn"
            >
              <span class="d-none d-sm-block mr-2">Stop</span>
              <v-icon>stop</v-icon>
            </v-btn>
            <v-btn
              v-else
              @click="$emit('record-state-change', recordStateEnum.MID_RECORD)"
              color="accent lighten-1"
              class="board-action-btn"
            >
              <span class="d-none d-sm-block mr-2">Record</span>
              <v-icon>adjust</v-icon>
            </v-btn>
          </v-col>
        </template>
        <template v-else>
          <v-col cols="auto" class="py-0">
            <!-- <v-btn
              @click="initReplayLogic()"
              outlined
              color="accent lighten-1"
              class="board-action-btn"
            >
              <span class="d-none d-sm-block mr-2">Preview</span>
              <v-icon>mdi-eye</v-icon>
            </v-btn>-->
          </v-col>
          <v-col cols="auto" class="py-0">
            <v-btn
              @click="$emit('record-state-change', recordStateEnum.PRE_RECORD)"
              outlined color="accent lighten-1" class="board-action-btn"
            >
              <span class="d-none d-sm-block mr-2">
                Retry
              </span>
              <v-icon>mdi-undo-variant</v-icon>
            </v-btn>
            <slot>
  
            </slot>
            <!-- <v-btn
              @click="$emit('video-save')"
              color="accent lighten-1"
              class="board-action-btn"
              :disabled="!hasUploadedAudio"
            >
              <span class="d-none d-sm-block mr-2">Save</span>
              <v-icon>save</v-icon>
            </v-btn> -->
          </v-col>
        </template>
      </v-row>
    </v-container>
  </v-app-bar>
</template>

<script>
import "vue-swatches/dist/vue-swatches.min.css";
import Swatches from "vue-swatches";
import CONSTANTS from "@/CONSTANTS.js";

export default {
  props: {
    color: String,
    eraserActive: Boolean,
    currentState: String,
    isRealtime: Boolean,
  },
  components: {
    Swatches
  },
  data () {
    return {
      colors: ["white", "orange", "#0AF2F2", "deeppink"],
      palleteVisibility: false,
      isSmallScreen: window.innerWidth < 960,
      recordStateEnum: CONSTANTS.recordStateEnum
    }
  },
  mounted() {
    window.addEventListener("resize", this.smallScreen);
    window.addEventListener("orientationchange", this.smallScreen);
    window.addEventListener("click", e => this.palleteClose(e), false);
    window.addEventListener("touchstart", e => this.palleteClose(e));
  },
  destroyed() {
    window.removeEventListener("resize", this.smallScreen);
    window.removeEventListener("orientationchange", this.smallScreen);
    window.removeEventListener("click", e => this.palleteClose(e));
    window.removeEventListener("touchstart", e => this.palleteClose(e));
  },
  methods: {
    palleteClick() {
      if (this.eraserActive) this.palleteVisibility = false;
      else this.palleteVisibility = !this.palleteVisibility;
    },
    setImage() {
      document.getElementById("whiteboard-bg-input").value = "";
      document.getElementById("whiteboard-bg-input").click();
    },
    smallScreen() {
      this.isSmallScreen = window.innerWidth < 960;
    },
    eraserClick() {
      this.palleteVisibility = false;
      this.$emit("eraser-click", true);
    },
    palleteClose(e) {
      var pallete = document.getElementById("swatches-wrapper");
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
.board-action-btn.normal-text {
  letter-spacing: unset;
  text-transform: unset;
  font-size: 0.9em;
}
.button-with-icon-and-text p {
  font-size: 0.6em;
  margin-bottom: 0;
}
</style>