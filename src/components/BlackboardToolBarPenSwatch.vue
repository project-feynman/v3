<template>
  <div style="display: flex; align-items: center;">
    <template v-for="(color, i) of user.penColors">
      <BaseButton v-if="!((i > 2) && $vuetify.breakpoint.smAndDown) && i < user.penColors.length - 1" :key="i"
        @click="handlePenClick(color, i)" 
        :filled="currentTool.color === color && currentTool.type === 'PEN'" 
        color="white" small 
      >
        <svg preserveAspectRatio="none" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
          :width="`${16 * scaleFactor(user.penWidths, i)}px`" height="35px" :viewBox="`0 0 100 230`" style="enable-background:new 0 0 100 230;" xml:space="preserve">
          <g>
            <path d="M0,0v72.377c0,1.588,0.234,3.169,0.698,4.706l45.416,150.032C46.633,228.828,48.212,230,50,230s3.367-1.172,3.886-2.883
              L99.31,77.079c0.457-1.525,0.69-3.108,0.69-4.702V0.002"/>
            <polygon :style="'fill:'+color+';'" points="50,211.978 38.879,175.24 61.122,175.24 	"/>
            <path style="fill:#424242;" d="M63.581,167.118H36.42L8.765,75.761l10.924-9.63l12.5,11.015c1.54,1.353,3.835,1.35,5.375-0.002
              l12.468-11.007l12.464,11.005c1.54,1.357,3.839,1.357,5.377,0l12.465-11.005l10.9,9.623L63.581,167.118z"/>
            <path :style="'fill:'+color+';'" d="M91.878,0v65.486l-8.852-7.813c-1.539-1.353-3.838-1.354-5.377,0.002L65.185,68.679L52.72,57.674
              c-1.539-1.356-3.838-1.354-5.377-0.002L34.871,68.683L22.375,57.67c-0.769-0.676-1.725-1.013-2.685-1.013
              c-0.959,0-1.919,0.339-2.685,1.013L8.121,65.5L8.098,0.024L91.878,0z"/>
          </g>
        </svg> 
        <v-icon v-if="user.email" x-small>mdi-menu-down</v-icon>
      </BaseButton>

      <BaseButton v-else-if="user.email" 
        @click="handleDiceClick(color, i)" 
        :icon="`mdi-dice-${diceNumber}`" 
        small 
        :color="color" 
        dark 
        :key="i + 'random-die'" 
        style="margin-left: 4px"
        :filled="currentTool.color === color && currentTool.type === 'PEN'" 
      >

      </BaseButton>
    </template>

    <!-- `retain-focus` avoids infinite recursion @see https://stackoverflow.com/questions/61444870/maximum-call-stack-size-exceeded-vuetify/64453969#64453969 -->
    <v-dialog v-model="isMenuOpen" width="500" :overlay-opacity="0.1" :retain-focus="true">
      <v-card>
        <v-card-title>Pencil Color</v-card-title>
        <v-card-text>
          <!-- Display colors -->
          <v-color-picker :value="newColorToUpdate"
            @update:color="selectedColorObject => newColorToUpdate = selectedColorObject.hex" 
            @input="selectedColorObject => newColorToUpdate = selectedColorObject.hex"
            dot-size="25"
            hide-canvas
            hide-sliders
            hide-inputs
            swatches-max-height="250"
            width="500"
            show-swatches
          ></v-color-picker>

          <div class="my-5">Pencil width</div>
          <v-slider 
            :value="newWidthToUpdate"
            @change="selectedWidth => newWidthToUpdate = selectedWidth" min="1" max="20"
            thumb-label="always"
            step="1"
            ticks="always"
            tick-size="1"
            style="margin-top: 40px"
          >

          </v-slider>
        </v-card-text>
        <v-card-actions>
          <v-spacer/>
          <v-btn @click="isMenuOpen = false; newColorToUpdate =  null; newWidthToUpdate = null;">CANCEL</v-btn>
          <v-btn @click="isMenuOpen = false; changePenColor(newColorToUpdate, whichPenToUpdate, newWidthToUpdate)">SAVE</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import BaseButton from "@/components/BaseButton.vue";
import db from "@/database.js"; 
import { mapState } from "vuex"; 

export default {
  props: {
    isPenActive: Boolean,
    colors: {
      type: Array,
      required: true
    }
  },
  components: { 
    BaseButton,
  },
  data () {
    return {
      isMenuOpen: false,
      newWidthToUpdate: null,
      newColorToUpdate: null,
      diceNumber: 5
    }
  },
  computed: {
    ...mapState([
      "user",
      "currentTool"
    ]),
  },
  created () {
    // TODO: if we guarantee backwards compatibility 
    // we can avoid all these extra code
    if (this.user.penWidths) {
      this.diceNumber = this.user.penWidths[3]
    }
  },
  methods: {
    scaleFactor (penWidths, i) {
      if (!penWidths) return 1
      else {
        const logarithmicFactor = 0.2
        const normalPenWidth = 2
        return (0.7 + (penWidths[i] / normalPenWidth) * logarithmicFactor) // e.g. 1.05
      }
    },
    handlePenClick (color, i) {
      const { currentTool } = this
      const alreadySelected = currentTool.color === color && currentTool.type === 'PEN'

      // backwards compatibility code for pen widths
      let width 
      if (!this.user.penWidths) width = 2
      else width = this.user.penWidths[i]

      if (!alreadySelected) {
        this.$store.commit("SET_CURRENT_TOOL", {
          type: "PEN",
          color: color,
          lineWidth: width
        })
      }
      else {
        this.isMenuOpen = true
        this.newColorToUpdate = color
        this.newWidthToUpdate = width
        this.whichPenToUpdate = i
      } 
    },
    handleDiceClick (color, i) {
      const { currentTool } = this
      const alreadySelected = currentTool.color === color && currentTool.type === 'PEN'
      if (!alreadySelected) {
        const penWidthsCopy = [ ...(this.user.penWidths || [2, 2, 2, 2]) ]
        this.$store.commit("SET_CURRENT_TOOL", {
          type: "PEN",
          color: color,
          lineWidth: penWidthsCopy[i]
        })
      } else {
        this.diceNumber = 1 + Math.floor( Math.random() * 6 )
        const newPencilWidth = this.diceNumber
        this.changePenColor(this.getRandomColor(), i, newPencilWidth)
      }
    },
    getRandomColor () {
      return "hsla(" + ~~(360 * Math.random()) + "," + // hue i.e. the "color"
                    "100%,"+  // 100% saturation i.e. maximize on its vividness and purity
                    "60%,1)"; // 60% lightness (how much black / white mix, otherwise too faded), 1 alpha
    },
    changePenColor (color, i, width = 2) {
      const penColorsCopy = [...this.user.penColors];
      penColorsCopy[i] = color
      const penWidthsCopy = [ ...(this.user.penWidths || [2, 2, 2, 2]) ]
      penWidthsCopy[i] = width
      db.collection("users").doc(this.user.uid).update({
        penColors: penColorsCopy,
        penWidths: penWidthsCopy
      });
      this.$store.commit("SET_CURRENT_TOOL", {
        type: "PEN",
        color: penColorsCopy[i],
        lineWidth: penWidthsCopy[i]
      })
      this.newWidthToUpdate = null
      this.newColorToUpdate = null
    }
  }
}
</script>
<style scoped>
svg {
  max-height: 30px;
}
.selected-color svg {
  max-height: 40px;
}

.dot {
  height: 20px;
  width: 20px;
  border-radius: 80%;
  display: block;
  /* display: inline-block; */
}
</style>