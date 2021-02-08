<template>
  <div></div>
</template>

<script>
export default {
  props: {
    classID: {
      type: String,
      required: true
    },
    questionID: {
      type: String,
      required: true
    }
  },
  created () {
    const { classID, questionID } = this; 
    this.$store.commit("SET_IS_VIEWING_FORUM", true); 
    this.$store.commit("SET_CURRENTLY_SELECTED_QUESTION_ID", questionID);
    
    this.$router.push(`/class/${classID}/section/${classID}/room/${classID}`); 
  }
};
</script>