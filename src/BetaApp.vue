<template>
  <v-app>
    <template v-if="$route.path != '/'">
      <TheSideDrawer :value="drawer"/>
    </template>
    <!-- RouterView "becomes" different components depending on the URL, and is specified in main.js -->
    <RouterView/>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue"

export default {
  props: {
    source: String,
  },
  components: {
    TheSideDrawer
  },
  data: () => ({
    drawer: true,
    items: [
      { icon: 'trending_up', text: 'Most Popular' },
      { icon: 'subscriptions', text: 'Subscriptions' },
      { icon: 'history', text: 'History' },
      { icon: 'featured_play_list', text: 'Playlists' },
      { icon: 'watch_later', text: 'Watch Later' },
    ],
    items2: [
      { picture: 28, text: 'Joseph' },
      { picture: 38, text: 'Apple' },
      { picture: 48, text: 'Xbox Ahoy' },
      { picture: 58, text: 'Nokia' },
      { picture: 78, text: 'MKBHD' },
    ],
  }),
  created () {
    this.$root.$on("toggle-drawer", () => this.drawer = !this.drawer)
  },
}
</script>