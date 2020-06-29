<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <v-navigation-drawer 
      :value="value" @input="newVal => $emit('input', newVal)" 
      app 
      clipped 
      width="375"
      class="the-side-drawer"
    >
      <!-- <v-btn text :to="(`/class/${classId}`)" block large color="accent" class="my-1">
        <v-icon class="pr-2">mdi-home</v-icon> 
        Overview
      </v-btn> -->
      <v-tabs v-model="activeTab" grow active-class="accent--text" class="side-tabs" slider-color="accent">
        <v-tab href="#archive">
          Library
        </v-tab>
        
        <v-tab href="#Q&A" data-qa="forum-tab">
          Q&A
        </v-tab>

        <v-tab href="#rooms" :disabled="!user" data-qa="blackboard-tab">
          Spaces
        </v-tab>
      </v-tabs>

      <v-tabs-items v-model="activeTab">
        <v-tab-item value="archive">
          <FileExplorer type="note"/>
        </v-tab-item>

        <v-tab-item value="Q&A">
          <FileExplorer type="question"/>
        </v-tab-item>
    
        <!-- File Explorer -->
        <!-- <v-tab-item>
          <v-list class="py-0">
            <v-list-item :disabled="!user" :to="(`/class/${classId}/posts/new`)" >
              <v-list-item-icon><v-icon>mdi-plus</v-icon></v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>New Post</v-list-item-title>
              </v-list-item-content>
            </v-list-item> 
          </v-list>

          <FileExplorer/>
        </v-tab-item> -->

        <!-- Room Explorer -->
        <v-tab-item v-if="user" value="rooms">
          <RoomExplorer/>
        </v-tab-item>
      </v-tabs-items>
    </v-navigation-drawer>
     
  </v-card>
</template>

<script>
import TheSideDrawerQuestions from "@/components/TheSideDrawerQuestions.vue";
import FileExplorer from "@/components/FileExplorerByDate.vue";
import RoomExplorer from "@/components/RoomExplorer.vue";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import { tutorial } from "@/CONSTANTS.js";
import { mapState } from "vuex";
import firebase from "firebase/app";
import "firebase/firestore";

export default {
  props: {
    value: Boolean
  },
  components: {
    FileExplorer,
    RoomExplorer,
    BasePopupButton,
    TheSideDrawerQuestions
  },
  data () {
    return {
      activeTab: "archive"
    }
  },
  computed: { 
    ...mapState([
      "user"
    ]),
    classId () { 
      return this.$route.params.class_id; 
    },
    roomId () {
      return this.$route.params.room_id;
    }
  }
};
</script>

<style scoped>
.blackboard-item .active-count {
  font-size:0.85em;
}
.blackboard-item .active-blackboard-users {
  display:none;
}
.blackboard-item.active-blackboard .active-count {
  display:none;
}
.blackboard-item.active-blackboard .active-blackboard-users {
  display:block;
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
