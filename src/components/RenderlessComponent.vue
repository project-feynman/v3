<template>
  <div v-if="strokes">
    <slot :strokes="strokes">
      {{ strokes }}
    </slot>
  </div>
</template>

<script>
import db from "@/database.js"

export default {
  props: {
    whiteboardID: String
  },
  data () {
    return {
      strokes: null
    }
  },
  async created () {
    if (!this.whiteboardID) {
      return 
    }
    const strokesRef = db.collection("whiteboards").doc(this.whiteboardID).collection("strokes")
    await this.$binding("strokes", strokesRef.orderBy("strokeNumber", "asc"))
  }
}

</script>