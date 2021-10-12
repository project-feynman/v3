<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"

export default {
  props: {
    blackboardRef: Object
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
      descriptionHtml: '',
      totalPoints: 0,
      unsubFunc: null,
      views: 0,
      upvotes: 0
    };
  },
  created () {
    this.isLoading = true
    this.unsubFunc = this.blackboardRef.onSnapshot(doc => {
      // doc.id, doc.ref.path, doc.data()
      const d = { id: doc.id, ...doc.data() }
      this.boardDoc = d
      this.creator = d.creator
      this.date = d.date 
      this.backgroundImageDownloadURL = d.backgroundImageDownloadURL
      this.audioDownloadURL = d.audioDownloadURL
      this.title = d.title
      this.descriptionHtml = d.descriptionHtml
      this.totalPoints = d.totalPoints
      this.isLoading = false
      this.views = d.views
      this.upvotes = d.upvotes || 0
    })
  },
  destroyed () {
    this.unsubFunc()
  },
  render () {
    return this.$scopedSlots.default({
      boardDoc: this.boardDoc,
      backgroundImageDownloadURL: this.backgroundImageDownloadURL,
      creator: this.creator,
      date: this.date,
      audioDownloadURL: this.audioDownloadURL,
      title: this.title,
      descriptionHtml: this.descriptionHtml,
      totalPoints: this.totalPoints,
      isLoading: this.isLoading,
      views: this.views,
      upvotes: this.upvotes
    });
  }
}
</script>

