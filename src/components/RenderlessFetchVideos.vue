<template>
  <div style="height: 100%">
    <slot :videos="videos">
      {{ videos }}
    </slot>
  </div>
</template>

<script>
import db from "@/database.js"

export default {
  props: {
    classID: String,
    tabNumber: Number
  },
  data () {
    return {
      videos: []
    }
  },
  async created () {
    if (this.classID == null|| this.tabNumber == null) {
      return 
    }
    const ref = db.collection("whiteboards").where("fromClass", "==", this.classID).where("tabNumber", "==", this.tabNumber)
    ref.onSnapshot(querySnapshot => {
      this.videos = []
      querySnapshot.forEach(doc => {
        this.videos.push({".key": doc.id, ...doc.data()})
      })
    })
  }
}
</script>