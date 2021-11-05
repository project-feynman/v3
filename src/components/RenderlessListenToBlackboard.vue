<script>
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/firestore'
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import { getRandomId } from '@/helpers.js'

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
      upvotes: 0,

      // comments related 
      isDisplayingComments: false,
      allComments: null, // AF(null) means not fetched, AF([]) means fetched but 0 comments
      unsubCommentsListener: null,
      newComment: '',
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
    if (this.unsubCommentsListener) this.unsubCommentsListener()
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
      upvotes: this.upvotes,
      func: this.func,
      isDisplayingComments: this.isDisplayingComments,
      listenToComments: this.listenToComments, 
      allComments: this.allComments,
      newComment: this.newComment,
      editNewComment: this.editNewComment,
      submitNewComment: this.submitNewComment
    })
  },
  methods: {
    func () {
      this.isDisplayingComments = !this.isDisplayingComments
    },
    async listenToComments () {
      if (!this.unsubCommentsListener) {
        this.unsubCommentsListener = this.$_bindVarToDB({
          varName: 'allComments',
          dbRef: this.blackboardRef.collection('comments').orderBy('date', 'asc'),
          component: this
        })
      }
    },
    editNewComment (newValue) {
      this.newComment = newValue
    },
    async submitNewComment (creator) {
      // `comment` can potentially be confusing, as it both means the text itself and the full object
      const batch = db.batch()
      batch.set(this.blackboardRef.collection('comments').doc(getRandomId()), {
        content: this.newComment,
        date: new Date().toISOString(), // firebase.firestore.FieldValue.serverTimestamp(),
        creatorUID: creator.uid,
        creator: {
          firstName: creator.firstName,
          lastName: creator.lastName,
          uid: creator.uid
        }
      })
      batch.update(this.blackboardRef, {
        numOfComments: firebase.firestore.FieldValue.increment(1)
      })
      await batch.commit()
      this.newComment = ''
    }
  },
}
</script>

