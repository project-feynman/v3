<template>
  <v-app>
    <TheAppBar 
      :key="$route.name + ($route.params.class_id || '')" 
      @toggle-drawer="drawer = !drawer"
    >
      <TheDropdownMenu 
        @sign-out="signOut()" 
        @settings-changed="(S) => updateSettings(S)"
      >
        <template v-slot:default="{ on }">
          <ButtonNew :on="on" filled icon="mdi-settings">Settings</ButtonNew>
        </template>
      </TheDropdownMenu>
    </TheAppBar>
    <TheSideDrawer v-model="drawer"/>
    <v-content>
      <RouterView :key="$route.fullPath"/>
    </v-content>
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
    drawer: true
  }),
  computed: {
    user () {
      return this.$store.state.user;
    }
  },
  methods: {
    async updateSettings (payload) {
      const userRef = db.doc(`users/${this.user.uid}`);
      userRef.update({ 
        enrolledClasses: payload 
      });
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


