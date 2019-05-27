<template>
  <video v-show="true" 
         :srcObject.prop="todo.srcObject" 
         :muted="todo.muted" 
         :id="todo.id"
         controls autoplay playsinline
  />
</template>

<script>
export default {
  // props: ['todo']
  props: {
    todo: Object
  }
}
</script>

<style>
video {
  height: 50px;
  width: 25vw;
}
</style>