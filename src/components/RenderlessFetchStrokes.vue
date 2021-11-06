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
      isLoading: false
    }
  },
  methods: {
    async fetchStrokes () {
      this.isLoading = true;
      const promises = [];
      let strokesArray = []
      let imageBlob = null
      const strokesPromise = this.$_getCollection(this.strokesRef.orderBy("strokeNumber", "asc")).then(result => strokesArray = result)
      promises.push(strokesPromise);
      if (this.imageDownloadUrl) {
        const imagePromise = this.$_getBlobFromStorage(this.imageDownloadUrl).then(result => imageBlob = result)
        promises.push(imagePromise);
      }       
      try {
        await Promise.all(promises);
        // hydrate these variables SIMULTANEOUSLY, which simplifies implementation of `DoodleVideo` and `DoodleAnimation`
        [this.strokesArray, this.imageBlob] = [strokesArray, imageBlob] 
        this.isLoading = false
      } catch (error) {
        // has fetched
        console.log('error =', error)
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

