<template>
  <div></div>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import CanvasDrawMixin from "@/mixins/CanvasDrawMixin.js";
import db from "@/database.js";

export default {
  props: {
    blackboardId: {
      type: String,
      required: true
    }
  },
  mixins: [
    DatabaseHelpersMixin,
    CanvasDrawMixin
  ],
  created () {
    this.keepSyncingBoardWithDb();
    this.keepSyncingImage();
  },
  data () {
    return {
      strokesArray: [],
      imageBlob: null,
      isInitialFetch: true
    };
  },
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  methods: {
    getStrokesArray () {
      return this.strokesArray;
    },
    async keepSyncingImage () {
      this.roomRef = db.doc(`classes/${this.mitClass.id}/blackboards/${this.blackboardId}`);
      this.unsubscribe2 = this.roomRef.onSnapshot((snapshot)=>{
        let newObj = {};
        let imageURL = ""
        for (const property in snapshot.data()) {
          if ((typeof snapshot.data()[property]) == "string"){
            console.log("got imageurl prop")
            imageURL = snapshot.data()[property];
            const blob = this.$_getBlobFromStorage(imageURL).then((blob) => {
              console.log("blobRetreived from snapshot", blob);
              this.$emit('new-bg-image-from-db', blob)
            });
          }
          
        }
      })
    },
    keepSyncingBoardWithDb () {
      this.strokesRef = db.collection(`classes/${this.mitClass.id}/blackboards/${this.blackboardId}/strokes`);
      this.unsubscribe = this.strokesRef.orderBy("strokeNumber").onSnapshot((snapshot) => {
        if (snapshot.docs.length === 0) {
          this.strokesArray = [];
          this.$emit("db-wiped");
        }
        for (let change of snapshot.docChanges()) {
          if (change.type !== "added") { continue; }
          const newStroke = {
            id: change.doc.id,
            ...change.doc.data()
          };
          this.strokesArray.push(newStroke);
          if (!this.isInitialFetch) {
            this.$emit("new-stroke-from-db", newStroke);
          }
        }
        if (this.isInitialFetch) {
          this.$emit("initial-strokes-fetched", this.strokesArray);
          this.isInitialFetch = false;
        }
      });
    }
  },
  render () {
    return this.$scopedSlots.default({
      isLoading: this.isLoading
    });
  }
}
</script>
