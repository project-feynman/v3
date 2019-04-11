<template>
  <nav>
    <!-- NAVBAR  -->
    <v-toolbar v-if="showNavbar" app flat color="white" extended extension-height="2" id="navbar">
      <img src="favicon.ico">
      <v-toolbar-title class="headline font-weight-light ml-2">
        {{ $route.params.class_id ? $route.params.class_id : "ExplainMIT" }}
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <template v-if="user && $route.path == '/'">
        <new-class-popup
          v-model="newClassPopup"
          @create-class="courseNumber => createClass(courseNumber)"
        ></new-class-popup>

        <!-- <v-btn icon @click="newClassPopup = true">
          <v-icon medium>add</v-icon>
        </v-btn> -->
        <v-btn @click="newClassPopup = true" flat>
          CREATE CLASS
        </v-btn>

      </template>

      <v-btn v-if="user && $route.path == '/'" icon @click="signOut()">
        <v-icon large color="pink">account_circle</v-icon>
      </v-btn>
      
      <v-btn v-else-if="user && $route.params.video_id" icon @click="replaySilentAnimation()">
        <v-icon medium>replay</v-icon>
      </v-btn>

      <v-btn v-else-if="user && $route.path != '/' " icon @click="toggleFullscreen()">
        <v-icon medium>fullscreen</v-icon>
      </v-btn>
      <!-- loading indicator -->
      <v-progress-linear
        v-if="isLoading"
        slot="extension"
        :indeterminate="true"
        height="2"
        class="ma-0"
      />
    </v-toolbar>
    <v-navigation-drawer app stateless v-if="$route.path != '/'" v-model="drawerOpen">
      <v-list>
        <!-- HOME -->
        <v-list-tile router to="/">
          <v-list-tile-action>
            <v-icon>home</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Home</v-list-tile-title>
        </v-list-tile>

        <v-list-tile router :to="`/${$route.params.class_id}/ranking`">
          <v-list-tile-action>
            <v-icon>poll</v-icon>
          </v-list-tile-action>
          <v-list-tile-title>Ranking</v-list-tile-title>
        </v-list-tile>

        <v-list-group prepend-icon="account_circle" value="true">
          <v-list-tile slot="activator">
            <v-list-tile-title>Workspaces</v-list-tile-title>
          </v-list-tile>

          <v-list-tile
            v-for="(workspace, idx) in teacherWorkspaces"
            :key="workspace['.key']"
            router
            :to="`/${$route.params.class_id}/workspace/${workspace['.key']}`"
          >
            <template v-if="workspace.members">
              <template v-if="workspace.members.length != 0">
                <v-list-tile-title>
                  Workspace {{ idx }}
                </v-list-tile-title>
                <v-icon 
                  v-for="idx in workspace.members.length" 
                  :key="idx"
                  color="pink"
                >
                  person
                </v-icon>
              </template>
              <div v-else class="text-xs-center">Workspace {{ idx }}</div>
            </template>

            <v-list-tile-title v-else class="black--text">Workspace {{ idx }}</v-list-tile-title>
          </v-list-tile>
        </v-list-group>

        <v-list-group prepend-icon="library_books" value="true">
          <v-list-tile slot="activator">
            <v-list-tile-title>Saved Explanations</v-list-tile-title>
          </v-list-tile>
          <v-list-tile
            v-for="explanation in teacherExplanations"
            :key="explanation['.key']"
            router
            :to="`/${teacherUid}/${explanation['.key']}`"
          >
            <v-list-tile-title>{{ explanation.title }}</v-list-tile-title>
          </v-list-tile>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>
  </nav>
</template>

<script>
import { mapState } from "vuex";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/auth";
import NewClassPopup from "@/components/NewClassPopup.vue";

export default {
  components: {
    NewClassPopup
  },
  computed: {
    ...mapState(["user"]),
    isLoading() {
      return this.loadingAnimation;
    },
    teacherUid() {
      return this.$route.params.class_id;
    }
  },
  data() {
    return {
      newClassPopup: false,
      showNavbar: true,
      prev_teacherUid: null,
      teacherWorkspaces: null,
      studentWorkspaces: null,
      workspaces: null,
      teacherExplanations: null,
      newTitle: "",
      isExplanationPage: false,
      drawerOpen: false,
      clickedButtonStateName: null,
      loading: false,
      loadingAnimation: true,
      dialog: false
    };
  },
  watch: {
    $route: {
      handler: "updateNavComponents",
      immediate: true
    },
    clickedButtonStateName() {
      const buttonState = this.clickedButtonStateName;
      this[buttonState] = !this[buttonState];
      this.$root.$on(
        "delete-whiteboard-strokes-success",
        () => (this[buttonState] = false)
      );
      this.clickedButtonStateName = null;
    }
  },
  methods: {
    replaySilentAnimation () {
      this.$root.$emit('replay-silent-animation')
    },
    toggleFullscreen() {
      this.$root.$emit('open-whiteboard')
    },
    createClass(courseNumber) {
      const ref = db.collection("classes").doc(courseNumber);
      ref.set({
        courseNumber
      });
    },
    signOut() {
      firebase.auth().signOut();
    },
    loginWithGoogle() {
      var provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider);
    },
    updateNavComponents() {
      const path = this.$route.path;
      const pathParts = path.split("/");
      const teacher_id = this.$route.params.class_id;
      const classID = this.$route.params.class_id;
      // sidenav content should not reload everytime the user navigates between the workspaces, but should update
      // everytime the user visits a different TA page
      if (teacher_id) {
        // TA's office page
        if (teacher_id != this.prev_teacherUid) {
          // update workspaces and teacher explanations
          this.$binding(
            'teacherWorkspaces',
            db
              .collection("classes")
              .doc(classID)
              .collection("workspaces")
          );
          this.$binding(
            "teacherExplanations",
            db
              .collection("classes")
              .doc(classID)
              .collection("videos")
          );
          this.prev_teacherUid = teacher_id;
          setTimeout(() => (this.drawerOpen = true), 0); // quick-fix for whiteboard touch detection offset bug
        }
      }
      if (pathParts[2] == "answer") {
        this.loadingAnimation = true;
        this.$root.$on(
          "finish-loading-animation",
          () => (this.loadingAnimation = false)
        );
      } else if (pathParts[2] == "workspace") {
        this.loadingAnimation = false;
      } else {
        this.loadingAnimation = false;
      }
    }
  }
};
</script>


