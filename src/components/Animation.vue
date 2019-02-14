<template>
  <div id="whiteboard">
    <canvas id="myCanvas" 
            style="width: 100%;
                   height: 75vh;
                   background-color: rgb(192, 230, 253);">
    </canvas>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import DrawMethods from '@/mixins/DrawMethods'
import db from '@/database.js'

export default {
  props: ['explanationId', 'strokes', 'workspaceId'],
  watch: {
    explanationId: {
      handler: 'initData',
      immediate: true 
    },
    allStrokes() {
      if (this.playProgress) {
        clearInterval(this.playProgress)
        this.playProgress = null 
      }
    }
  },
  mixins: [DrawMethods],
  computed: {
    ...mapState(['user']),
    author() {
      return {
        name: this.user.displayName,
        uid: this.user.uid
      }
    }
  },
  data() {
    return {
      playProgress: null,
      isReplaying: false,
      allStrokes: [],
      timer: null,
      currentTime: 0,
      idx: 0,
      index: 0,
      canvas: null,
      ctx: null,
      lastX: -1,
      lastY: -1,
      redrawTimeout: null,
      interval: null 
    }
  },
  mounted() {
    this.$root.$on('whiteboard-closed', () => {
      this.initData()
    })
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
  },
  beforeDestroy() {
    // clean up everything - needs testing
    if (this.playProgress) {
      clearInterval(this.playProgress)
    }
  },
  methods: {
    async initReplayLogic() {
      this.isReplaying = true
      await this.quickplay()
      this.isReplaying = false 
    },
    handleDeletion() {
      const classID = this.$route.params.teacher_id
      const videoID = this.$route.params.id
      db.collection('classes').doc(classID).collection('videos').doc(videoID).delete()
      // cleanly delete later 
    },
    async initData() {
      this.$emit('animation-loading')
      let strokesRef
      if (this.ctx) {
        // already loaded an explanation before, visually wipe previous drawings
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }
      if (this.strokes) {
        console.log('strokes is defined')
        this.allStrokes = strokes
        this.$root.$emit('finish-loading-animation')
        // this.drawStrokesInstantly()
        this.$emit('animation-loaded')
      } else if (this.workspaceId) {
        this.allStrokes = [] 
        strokesRef = db.collection('workspaces').doc(this.workspaceId).collection('strokes').orderBy('startTime', 'asc')
        await this.$binding('allStrokes', strokesRef)
        this.$emit('animation-loaded')
        console.log('workspace animation loaded!')
      }
      // old code
      else {
        this.allStrokes = [] 
        if (this.$route.params.id == 'OS63skygvahbbPwEK3LH') {
          strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes').orderBy('strokeNumber', 'asc')
        } else {
          strokesRef = db.collection('whiteboards').doc(this.explanationId).collection('strokes').orderBy('startTime', 'asc')
          // strokesRef = db.collection('explanations').doc(this.explanationId).collection('strokes').orderBy('startTime', 'asc')
        } 
        await this.$binding('allStrokes', strokesRef)
        this.$root.$emit('finish-loading-animation')
        // this.drawStrokesInstantly()
        this.$emit('animation-loaded')
      }
    }
  }
}
</script>


