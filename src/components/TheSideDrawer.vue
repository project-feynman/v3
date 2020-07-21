<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <v-navigation-drawer 
      :value="value" @input="newVal => $emit('input', newVal)" 
      app 
      clipped 
      width="380"
      class="the-side-drawer"
    >
      <v-tabs v-model="activeTab" grow active-class="accent--text" class="side-tabs" slider-color="accent">
        <v-tab href="#rooms" :disabled="!user" data-qa="blackboard-tab">
          Spaces
        </v-tab>
        
        <v-tab href="#Q&A" data-qa="forum-tab">
          Q&A
        </v-tab>

        <v-tab href="#archive">
          Library
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="activeTab">
        <v-tab-item value="archive">
          <FileExplorer type="note"/>
        </v-tab-item>

        <v-tab-item value="Q&A">
          <FileExplorer type="question"/>
        </v-tab-item>
    
        <v-tab-item v-if="user" value="rooms">
          <RoomExplorer/>
        </v-tab-item>
      </v-tabs-items>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import FileExplorer from "@/components/FileExplorerByDate.vue";
import RoomExplorer from "@/components/RoomExplorer.vue";
import { mapState } from "vuex";

export default {
  props: {
    value: Boolean
  },
  components: {
    FileExplorer,
    RoomExplorer
  },
  data () {
    return {
      activeTab: "rooms"
    }
  },
  created () {
    this.activeTab = this.$route.params.hasOwnProperty('room_id') ? 'rooms' : ( this.$route.params.hasOwnProperty('post_id') ? 'archive' : 'Q&A' );
  },
  computed: { 
    ...mapState([
      "user"
    ])
  }
};
</script>

<style scoped>
.blackboard-item .active-count {
  font-size: 0.85em;
}
.blackboard-item .active-blackboard-users {
  display: none;
}
.blackboard-item.active-blackboard .active-count {
  display: none;
}
.blackboard-item.active-blackboard .active-blackboard-users {
  display: block;
}
.side-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
.the-side-drawer {
  z-index: 10;
  max-width: 75%;
}
</style>
