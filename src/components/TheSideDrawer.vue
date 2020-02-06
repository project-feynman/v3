<template>
  <v-card style="zIndex:6">
    <v-navigation-drawer
      app
      :value="value"
      @input="newValue => $emit('input', newValue)"
      clipped
      width="250"
    >
      <v-list>
        <v-list-item :to="`/${$route.params.class_id}/videos`">
          <v-list-item-icon>
            <v-icon>video_library</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="subtitle-1 font-weight-regular">Saved videos</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider/>

        <v-list-item link :to="`/${$route.params.class_id}/questions`">
          <v-list-item-icon>
            <v-icon>group</v-icon>
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title class="subtitle-1 font-weight-regular">Q&A forum</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
        <v-divider />

        <!-- BLACKBOARDS -->
        <template v-if="hasFetchedWorkspaces">
          <v-list-item
            v-for="(workspace, i) in workspaces"
            :key="workspace['.key']"
            :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
          >
              <v-list-item-icon>
            <v-icon>phone_in_talk</v-icon>
          </v-list-item-icon>
            <template v-if="workspace.members">
              <v-list-item-content>
                Realtime Board {{ i }}
                <template v-for="(member, i) in workspace.members">
                  <div style="display: flex;" :key="i">
                    <v-icon :color="getUserColor()">person</v-icon>
                    <p class="pl-4 pt-4">{{ workspace.members[i].firstName }}</p>
                  </div>
                </template>
              </v-list-item-content>
            </template>
          </v-list-item>
          <v-list-item v-if="workspaces.length < 3" @click="addWorkspace()" link>
            <v-list-item-icon>
              <v-icon color="grey darken-1">add</v-icon>
            </v-list-item-icon>
            <v-list-item-content class="grey--text text--darken-1">NEW BOARD</v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import { mapState } from "vuex";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/auth";

export default {
  props: {
    value: Boolean
  },
  data () {
    return {
      prevClassID: "",
      workspaces: [],
      hasFetchedWorkspaces: false
    }
  },
  computed: {
    user () {
      return this.$store.state.user;
    }
  },
  watch: {
    $route: {
      handler: "updateNavComponents",
      immediate: true
    }
  },
  methods: {
    async addWorkspace () {
      const workspacesRef = db.collection("classes").doc(this.prevClassID).collection("workspaces");
      const whiteboardID = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      db.collection("whiteboards").doc(whiteboardID).set({});
      workspacesRef.add({
        ownerUID: this.user.uid || "anonymous",
        whiteboardID,
        members: []
      });
    },
    async updateNavComponents () {
      this.hasFetchedWorkspaces = false;
      const classID = this.$route.params.class_id;
      // sidenav content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (classID !== this.prevClassID) {
        // update sidenav content
        const classRef = db.collection("classes").doc(classID);
        await this.$binding("workspaces", classRef.collection("workspaces"));
        this.prevClassID = classID;
      }
      this.hasFetchedWorkspaces = true;
    },
    getUserColor () {
      return this.user ? this.user.color : "pink";
    }
  }
};
</script>