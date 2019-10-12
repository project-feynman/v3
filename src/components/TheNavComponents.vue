<template>
  <div>
    <the-nav-bar v-if="navbarOpen" @toggle-side-nav="sideNavOpen = !sideNavOpen"/>
    <the-side-nav v-if="sideNavOpen"/>
  </div>
</template>

<script>
import TheNavBar from "@/components/TheNavBar.vue"
import TheSideNav from "@/components/TheSideNav.vue"

export default {
  components: {
    TheNavBar,
    TheSideNav
  },
  data () {
    return {
      navbarOpen: true,
      sideNavOpen: true
    }
  },
  watch: {
    $route () {
      const path = this.$route.path
      const pathParts = path.split('/')
      if (pathParts[2] == "workspace") {
        this.navbarOpen = false 
      } else {
        this.navbarOpen = true 
      }
    }
  },
  created () {
    this.$root.$on("toggle-side-nav", () => { 
      this.sideNavOpen = !this.sideNavOpen
      this.$root.$emit("side-nav-toggled", this.sideNavOpen)
    })
  }
}
</script>