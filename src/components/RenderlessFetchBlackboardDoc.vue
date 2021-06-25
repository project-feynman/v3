<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    blackboardRef: Object,
  },
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      isLoading: false,
      backgroundImageDownloadURL: '',
      creator: '',
      date: '',
      audioDownloadURL: '',
      title: '',
      description: '',
      unsubFunc: null
    };
  },
  created () {
    this.isLoading = true
    this.unsubFunc = this.blackboardRef.onSnapshot(doc => {
      // doc.id, doc.ref.path, doc.data()
      const d = doc.data()
      this.creator = d.creator
      this.date = d.date 
      this.backgroundImageDownloadURL = d.backgroundImageDownloadURL
      this.audioDownloadURL = d.audioDownloadURL
      this.title = d.title
      this.description = d.description
      this.isLoading = false
    })
  },
  destroyed () {
    this.unsubFunc()
  },
  methods: {
    async fetchStrokes () {
      this.isLoading = true
      this.unsubFunc = await this.$_listenToDoc(this.blackboardRef, this, 'blackboardDoc')
      const { blackboardDoc } = this
      this.creator = blackboardDoc.creator
      this.date = blackboardDoc.date 
      this.backgroundImageDownloadURL = blackboardDoc.backgroundImageDownloadURL
      this.audioDownloadURL = blackboardDoc.audioDownloadURL
      this.isLoading = false
    }
  },
  render () {
    return this.$scopedSlots.default({
      backgroundImageDownloadURL: this.backgroundImageDownloadURL,
      creator: this.creator,
      date: this.date,
      audioDownloadURL: this.audioDownloadURL,
      title: this.title,
      description: this.description,

      fetchStrokes: this.fetchStrokes,
      strokesArray: this.strokesArray,
      imageBlob: this.imageBlob,
      isLoading: this.isLoading,
    });
  }
}
</script>

