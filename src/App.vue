<template>
  <v-app>
    <the-nav-components/>
    <v-content id="background">
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>
import TheNavComponents from "@/components/TheNavComponents.vue"

export default {
  name: 'App',
  components: {
    TheNavComponents
  },
  computed: {
    user () {
      return this.$store.state.user
    }
  }
}
</script>

<style>
#background {
  background-color: rgb(225, 233, 247)
}
</style>