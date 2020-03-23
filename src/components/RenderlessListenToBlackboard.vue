<template>
  <div>

  </div>
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
          }
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
