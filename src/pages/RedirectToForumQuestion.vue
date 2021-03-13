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
      // This component, in fact, never will get rendered because we never use <router-view/> 
    }
};
</script>