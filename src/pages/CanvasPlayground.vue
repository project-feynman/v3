<template>
  <div>
    <v-app-bar v-if="!isFullscreen" clipped-left app>
      
    </v-app-bar>

    <v-navigation-drawer app v-if="!isFullscreen" permanent>

    </v-navigation-drawer>

    <v-main style="overflow-x: auto">
      <!-- Canvas wrapper is helpful for re-sizing and layouts -->
      <div style="width: 100%; height: 100%">
        <v-btn @click="isVertical = !isVertical" absolute left color="pink" dark>
          <v-icon>mdi-phone-rotate-landscape</v-icon>
        </v-btn>

        <v-btn @click="isFullscreen = !isFullscreen" fab absolute right class="mt-5" color="pink" dark>
          <v-icon>mdi-fullscreen</v-icon>
        </v-btn>
        <!-- Blackboard -->
        <canvas ref="FrontCanvas" id="front-canvas" :key="widthHeightRatio" :style="`
          height: ${height}px; 
          width: ${width}px;
          background-color: rgb(62, 66, 66);
          display: block;
        `"
        >
        </canvas>
      </div>
    </v-main>
  </div>
</template>

<script>
const LANDSCAPE_WIDTH = 1500; 
const VERTICAL_MODE_WIDTH = 1000; 
const PPT_SLIDE_RATIO = 3/4; 
const PDF_RATIO = 11/8.5; 

export default {
  data () {
    return {
      widthHeightRatio: PPT_SLIDE_RATIO,
      width: LANDSCAPE_WIDTH,
      isFullscreen: false,
      isVertical: false
    };
  },
  computed: {
    height () {
      return this.width * this.widthHeightRatio; 
    }
  },
  watch: {
    isVertical () {
      if (this.isVertical) {
        this.changeToVerticalMode(); 
      } else {
        this.changeToLandscapeMode(); 
      }
    }
  },
  methods: {
    changeToLandscapeMode () {
      const canvas = document.getElementById("front-canvas"); 
      canvas.style.width = `${LANDSCAPE_WIDTH}px`;
      canvas.style.height = `${LANDSCAPE_WIDTH * 3/4}px`; 
    },
    changeToVerticalMode () {
      const canvas = document.getElementById("front-canvas"); 
      canvas.style.width = `${VERTICAL_MODE_WIDTH}px`
      canvas.style.height = `${VERTICAL_MODE_WIDTH * PDF_RATIO}px`
    }
  }
}
</script>



