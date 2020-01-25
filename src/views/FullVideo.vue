<template>
  <div class="video">
    <BaseAppBar :loading="!resourcesLoaded"/>
    <v-content>
      <v-container fluid class="pa-0">
        <DoodleVideoAnimation
          v-if="allStrokes.length !== 0"
          ref="animation"
          :isFullscreen="true"
          :strokes="allStrokes"
          :overlay="overlay"
          @animation-loaded="animationLoaded=true"
          @animation-finished="handleEvent()"
          @play-video="startVideo()"
        />
        <AudioRecorder
          v-if="audioURL"
          ref="audio-recorder"
          :audioURL="audioURL"
          @recorder-loading="recorderLoaded=false"
          @play="handlePlay()"
          @stop="handleStop()"
          @seeking="handleSeeking()"
          @recorder-loaded="recorderLoaded=true"
        />
      </v-container>
    </v-content>
  </div>
</template>

<script>
  import db from '@/database.js'
  import DoodleVideoAnimation from '@/components/DoodleVideoAnimation.vue'
  import AudioRecorder from '@/components/AudioRecorder.vue'
  import BaseAppBar from "@/components/BaseAppBar.vue"
  import BaseOverlay from "@/components/BaseOverlay.vue"
  import {mapState} from 'vuex'
  import firebase from 'firebase/app'
  import 'firebase/storage'
  import 'firebase/functions'

  export default {
    props: {
      strokes: Array,
      videoID: String
    },
    components: {
      DoodleVideoAnimation,
      AudioRecorder,
      BaseAppBar,
      BaseOverlay
    },
    computed: {
      ...mapState(['user']),
      resourcesLoaded () { return this.recorderLoaded && this.animationLoaded }
    },
    data () {
      return {
        video: null,
        audioURL: "",
        recorderLoaded: false,
        animationLoaded: false,
        syncInitialized: false,
        audioFileRef: null,
        allStrokes: [],
        thumbnail: "",
        overlay: true
      }
    },
    watch: {
      // figure out why both of these are necessary
      $route: {
        handler: "bindVariables",
        immediate: true
      },
      videoID: {
        handler: "bindVariables",
        immediate: true
      }
    },
    mounted () {
      window.addEventListener('resize', this.resizeVideo);
    },
    destroyed () {
      window.removeEventListener('resize', this.resizeVideo);
    },
    methods: {
      handlePlay() {
        const animation = this.$refs['animation'];
        animation.overlay = false;
        this.initializeAnimation();

        // Initialize playback synchronization if possible.
        if (this.syncInitialized) {
          animation.sync = setTimeout(animation.syncVisualWithAudio, 0);
        }
      },
      handleStop() {
        // Stop sync.
        const animation = this.$refs['animation'];
        clearTimeout(animation.sync);
        animation.sync = undefined;
      },
      handleSeeking() {
        // Stop first.
        this.handleStop();

        // Call once.
        const animation = this.$refs['animation'];
        animation.syncVisualWithAudio(true);
      },
      resizeVideo() {
        // Rescale canvas.
        const animation = this.$refs['animation'];
        animation.rescaleCanvas(false);

        // If we are in playback, just resize, stop, reset, and play. This will re-render. Otherwise, redraw everything.
        if (animation.sync) {
          this.handleStop();
          animation.indexOfNextFrame = 0;
          this.handlePlay();
        } else {
          animation.drawStrokesInstantly();
        }
      },
      startVideo() {
        const audioRecorder = this.$refs['audio-recorder'];
        audioRecorder.playAudio();
      },
      initializeAnimation() {
        if (!this.syncInitialized && this.resourcesLoaded) {
          const audioRecorder = this.$refs['audio-recorder'];
          const animation = this.$refs['animation'];
          animation.startSync(audioRecorder.getAudioTime);
          this.syncInitialized = true;
        }
      },
      quickplay() {
        const animation = this.$refs['animation'];
        if (animation) animation.quickplay();
      },
      async bindVariables() {
        // TODO: just keep track of this.video so that I don't need to keep track of this.audioURL, this.audioPath explictly

        // initialize/reset variables
        this.syncInitialized = false;
        this.recorderLoaded = false;
        this.animationLoaded = false;
        this.audioURL = '';

        // retrieve video
        const classID = this.$route.params.class_id;
        let videoRef = null;
        if (!this.videoID) {
          const videoID = this.$route.params.video_id;
          videoRef = db.collection('whiteboards').doc(videoID);
        } else {
          videoRef = db.collection("whiteboards").doc(this.videoID);
        }
        let video = await videoRef.get();
        video = video.data();
        // fix delete button logic
        this.video = video;
        this.thumbnail = video.thumbnail;
        // set audio and visual
        this.audioURL = video.audioURL;
        const strokesRef = videoRef.collection('strokes');
        if (video.audioPath) await this.$binding('allStrokes', strokesRef.orderBy('startTime', 'asc'));
        else await this.$binding('allStrokes', strokesRef.orderBy('strokeNumber', 'asc'));

        // bind references to make it easy to delete things
        const storageRef = firebase.storage().ref();
        if (video.audioPath) {
          this.audioFileRef = storageRef.child(`recordings/${video.audioPath}`);
        }
      },
      async deleteVideo() {
        const recursiveDelete = firebase.functions().httpsCallable('recursiveDelete');
        recursiveDelete({path: `whiteboards/${this.$route.params.video_id}`});
        if (this.audioFileRef) this.audioFileRef.delete();
        // redirect
        this.$router.push(`/${this.$route.params.class_id}/ranking`);
      }
    }
  }
</script>
