<template>
  <video v-show="true" 
         :srcObject.prop="todo.srcObject" 
         :muted="todo.muted" 
         :id="todo.id"
         controls autoplay playsinline
  >
  </video>
</template>

<script>
export default {
  props: ['todo']
}
</script>

<style>
video {
  height: 50px;
  width: 25vw;
}
</style>