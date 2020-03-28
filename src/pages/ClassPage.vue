<template>
  <v-app>
    <!-- TODO: rename `subpage` -->
    <template v-if="subpage">
      <TheAppBar>
        <TheDropdownMenu @sign-out="signOut()" @settings-changed="(S) => updateSettings(S)">
          <template v-slot:default="{ on }">
            <ButtonNew :on="on" :filled="true" icon="mdi-settings">Settings</ButtonNew>
          </template>
        </TheDropdownMenu>
      </TheAppBar>
      <TheSideDrawer v-model="drawer" :mitClass="mitClass"/>
      <v-content>
        <RouterView :key="$route.fullPath"/>
      </v-content>
    </template>
  </v-app>
</template>

<script>
import TheSideDrawer from "@/components/TheSideDrawer.vue";
import TheAppBar from "@/components/TheAppBar.vue";
import TheDropdownMenu from "@/components/TheDropdownMenu.vue";
import ButtonNew from "@/components/ButtonNew.vue";
import db from "@/database.js";

export default {
  components: { 
    TheSideDrawer,
    TheAppBar,
    TheDropdownMenu,
    ButtonNew
  },
  data: () => ({
    drawer: true,
    subpage: false
  }),
  computed: {
    mitClass () {
      return this.$store.state.mitClass;
    },
    user () {
      return this.$store.state.user;
    }
  },
  async created () {
    this.$root.$on("toggle-drawer", () => this.drawer = !this.drawer);
    await this.$store.dispatch("fetchClass", this.$route.params.class_id);
    this.subpage = true;
  },
  methods: {
    async updateSettings (payload) {
      const userRef = db.doc(`users/${this.user.uid}`);
      userRef.update({ enrolledClasses: payload })
    }
  }
}
</script>

<style>
/* Make the side-drawer vertically scrollable  */
html {
  overflow-y: auto; 
}
</style>


