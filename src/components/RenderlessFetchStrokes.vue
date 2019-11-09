<template>
  <div style="height: 100%">
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
      strokes: []
    }
  },
  async created () {
    if (!this.whiteboardID) {
      return 
    }
    const strokesRef = db.collection("whiteboards").doc(this.whiteboardID).collection("strokes").orderBy("strokeNumber", "asc")
    strokesRef.get().then(querySnapshot => {
      querySnapshot.forEach(doc => {
        this.strokes.push({".key": doc.id, ...doc.data()})
      })
    })
  }
}

</script>