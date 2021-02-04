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
    console.log("classID, questionID =", classID); 
    console.log("questionID =", questionID); 
    this.$store.commit("SET_IS_VIEWING_FORUM", true); 
    this.$store.commit("SET_CURRENTLY_SELECTED_QUESTION_ID", questionID);
    
    console.log('about to rediret");');
    this.$router.push(`/class/${classID}/section/${classID}`); 
  }
};
</script>