<template>
  <v-dialog :value="isClassSettingsPopupOpen" @input="newValue => $emit('input', newValue)" width="600">
    <v-card>
      <v-card-title>
        {{ currentClass.name }} settings
      </v-card-title>

      <v-card-text>
        Get emailed whenever a classmate asks a question
        <v-switch 
          :input-value="user.emailOnNewQuestion.includes($route.params.class_id)" 
          @change="isEnabled => toggleEmailOnNewQuestion(isEnabled)"
        >
        </v-switch> 

        Get emailed whenever someone replies to a question that you asked or replied to
        <v-switch 
          :input-value="user.emailOnNewReply.includes($route.params.class_id)" 
          @change="isEnabled => toggleEmailOnNewReply(isEnabled)"
        >
        </v-switch> 

          <v-subheader class="px-0">Or leave {{ currentClass.name }}</v-subheader>
          <v-btn v-if="user.enrolledClasses.length >= 2" 
            @click="leaveClass()" 
            color="black" class="mt-2" text
          >
            Leave {{ currentClass.name }}
          </v-btn>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
        <v-btn @click="$emit('input', false);">DONE</v-btn>
      </v-card-actions>
    </v-card> 
  </v-dialog> 
</template>

<script>
import db from "@/database.js"; 
import firebase from "firebase/app";
import "firebase/firestore"; 
import { mapState } from "vuex"; 

export default {
  props: {
    isClassSettingsPopupOpen: {
      type: Boolean,
      required: true 
    }
  },
  data () {
    return {
      isPopupOpen: false
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    userRef () {
      return db.doc(`users/${this.user.uid}`)
    },
    currentClass () {
      for (const mitClass of this.user.enrolledClasses) {
        if (mitClass.id === this.$route.params.class_id) {
          return mitClass; 
        }
      }
    }
  },
  methods: {
    toggleEmailOnNewReply (isEnabled) { 
      const { class_id } = this.$route.params; 
      const ref = db.doc(`users/${this.user.uid}`); 
      if (isEnabled) {
        console.log("unioning");
        ref.update({
          emailOnNewReply: firebase.firestore.FieldValue.arrayUnion(class_id)
        }); 
      } 
      else {
        console.log("removing"); 
        ref.update({
          emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(class_id)
        }); 
      }
    },
    toggleEmailOnNewQuestion (isEnabled) {
      const { class_id } = this.$route.params; 
      const ref = db.doc(`users/${this.user.uid}`);
      if (isEnabled) {
        console.log("unioning question"); 
        ref.update({
          emailOnNewQuestion: firebase.firestore.FieldValue.arrayUnion(class_id)
        });
      } 
      else {
        console.log("removing question"); 
        ref.update({
          emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(class_id)
        }); 
      }
    },
    async leaveClass () {
      const { user } = this; 
      let classToRemove = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id === this.$route.params.class_id) {
          classToRemove = enrolledClass;
          break; 
        }
      }

      // bad quickfix code to find a different classID to become the default redirected class
      let newDefaultRedirectedClass = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id !== classToRemove.id) {
          newDefaultRedirectedClass = enrolledClass; 
          break; 
        }
      }

      const { id } = newDefaultRedirectedClass; 
      this.$router.push(`/class/${id}/section/${id}/room/${id}`);

      await db.collection("users").doc(user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: newDefaultRedirectedClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(classToRemove.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(classToRemove.id)
      });
    }
  }
};
</script>