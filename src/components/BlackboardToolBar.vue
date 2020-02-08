<template>
  <v-app-bar dense :color="isRealtime?'#fff':'#eee'" :elevation="isRealtime?0:1" class="blackboard-toolbar">
    <v-container class="py-1 px-0">
      <v-row align="center" justify="space-between">
        <template v-if="currentState !== recordStateEnum.POST_RECORD">
          <v-col class="py-0">
            <v-row justify="start" align="center">
              <v-col class="px-1 py-0" cols="auto">
                <div
                  :class="[$vuetify.breakpoint.smAndDown? 'dropdown ':'', palleteVisibility? 'active ':'', 'd-flex',]"
                  id="swatches-wrapper"
                  @click="$emit('eraser-click', false)"
                >
                  <v-btn
                    :color="(!$vuetify.breakpoint.smAndDown || palleteVisibility || eraserActive)? 'accent lighten-1':color"
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
                    :wrapper-style="{ padding:'0px', maxHeight:'26px', display:'flex'}"
                    :swatch-style="{ margin:'0 5px', borderRadius:'50%' }"
                    inline
                    background-color="rgba(0, 0, 0, 0)"
                    swatch-size="26"
                  />
                </div>
              </v-col>
              <ButtonPrabhakar @click="eraserClick()" :outlined="!eraserActive" icon="mdi-eraser" :isNormalText="true">
                Eraser
              </ButtonPrabhakar>
            </v-row>
          </v-col>
        </template>
          <template v-if="currentState === recordStateEnum.PRE_RECORD">
            <v-col class="py-0 px-0" cols="auto">
              <ButtonPrabhakar @click="clickImage()" :isSuperSmallText="true" :outlined="!imageAdded || blackboardAttached" icon="image">
                <p>{{ imageAdded? "Change" : "Attach" }}<br>IMAGE</p>
              </ButtonPrabhakar>
            </v-col>
            <v-col class="py-0 px-0" cols="auto">
              <ButtonPrabhakar @click="$emit('wipe-board')" :isSuperSmallText="true" :outlined="true" icon="delete_outline">
                <p>WIPE<br>BOARD</p>
              </ButtonPrabhakar>
            </v-col>
            <v-col cols="auto" class="py-0 px-0">
              <ButtonPrabhakar @click="$emit('record-state-change', recordStateEnum.MID_RECORD)" icon="adjust">
                Record
              </ButtonPrabhakar>
            </v-col>
          </template>

          <template v-else-if="currentState === recordStateEnum.MID_RECORD">
            <v-col class="py-0 px-0" cols="auto">
              <ButtonPrabhakar @click="$emit('record-state-change', recordStateEnum.POST_RECORD)">
                Stop
              </ButtonPrabhakar>
            </v-col>
          </template>

        <template v-else>
          <v-col class="py-0 px-0" cols="auto">
            <ButtonPrabhakar @click="$emit('record-state-change', recordStateEnum.PRE_RECORD)" outlined icon="mdi-undo-variant">
              Retry
            </ButtonPrabhakar>
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
import CONSTANTS from "@/CONSTANTS.js";
import ButtonPrabhakar from "@/components/ButtonPrabhakar.vue"

export default {
  props: {
    color: String,
    eraserActive: Boolean,
    currentState: String,
    isRealtime: Boolean,
  },
  components: {
    Swatches,
    ButtonPrabhakar
  },
  data () {
    return {
      colors: ["white", "orange", "#0AF2F2", "deeppink"],
      palleteVisibility: false,
      recordStateEnum: CONSTANTS.recordStateEnum,
      imageAdded: false,
      blackboardAttached: true
    }
  },
  mounted() {
    window.addEventListener("click", e => this.palleteClose(e), false);
    window.addEventListener("touchstart", e => this.palleteClose(e));
  },
  destroyed() {
    window.removeEventListener("click", e => this.palleteClose(e));
    window.removeEventListener("touchstart", e => this.palleteClose(e));
  },
  methods: {
    setImage () {
      document.getElementById("whiteboard-bg-input").value = "";
      document.getElementById("whiteboard-bg-input").click();
    },
    eraserClick () {
      this.palleteVisibility = false;
      this.$emit("eraser-click", true);
    },
    palleteClick () {
      if (this.eraserActive) this.palleteVisibility = false;
      else this.palleteVisibility = !this.palleteVisibility;
    },
    palleteClose (e) {
      var pallete = document.getElementById("swatches-wrapper");
      if (pallete && !pallete.contains(e.target)) {
        this.palleteVisibility = false;
      }
    },
    clickImage (e) {
      // TODO
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