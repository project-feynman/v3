<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    strokesRef: Object,
    imageDownloadUrl: String
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      strokesArray: [],
      imageBlob: null,
      isLoading: false,
      unsubscribeStrokesListener: null
    };
  },
  destroyed () {
    this.unsubscribeStrokesListener(); 
  },
  methods: {
    async fetchStrokes () {
      this.isLoading = true;
      const promises = [];
      this.unsubscribeStrokesListener = this.$_bindVarToDB({
        varName: "strokesArray",
        dbRef: this.strokesRef.orderBy("strokeNumber", "asc"),
        component: this
      });
      if (this.imageDownloadUrl) {
        const imagePromise = this.$_getBlobFromStorage(this.imageDownloadUrl).then((imageBlob) => this.imageBlob = imageBlob);  
        promises.push(imagePromise);
      }       
      try {
        await Promise.all(promises);
        this.isLoading = false;
      } catch (error) {
        this.$root.$emit("show-snackbar", "Error: cannot fetch video strokes and/or image")
      }
    }
  },
  render () {
    return this.$scopedSlots.default({
      fetchStrokes: this.fetchStrokes,
      strokesArray: this.strokesArray,
      imageBlob: this.imageBlob,
      isLoading: this.isLoading
    });
  }
}
</script>

