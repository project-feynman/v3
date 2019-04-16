<template>
  <video v-show="true" controls autoplay playsinline :srcObject.prop="todo.srcObject" :muted="todo.muted" :id="todo.id">
  </video>
</template>

<script>
export default {
  props: ['todo']
}
</script>