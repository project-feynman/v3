<template>
  <div style="height: 100%">
    <slot :fetchedData="fetchedData">

    </slot>
  </div>
</template>

<script>
export default {
  props: {
    fetchedData: Array
  },
  create () {
    this.$emit("initialization")
  }
}
</script>