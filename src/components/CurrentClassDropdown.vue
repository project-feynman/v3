<template>
  <v-menu v-model="isMenuOpen" 
    :close-on-content-click="false"
    bottom offset-y min-width="250" max-width="50"
  >
    <template v-slot:activator="{ on }">
      <!-- The limiting case that max-width must work for is a laptop with the scrollbar taking up additional width  -->
      <!-- Both `max-width: fit-content` are necessary, analysis is slightly complicated
       -->
      <v-list-item v-on="on" two-line class="px-0" style="max-width: fit-content">
        <v-list-item-content v-if="mitClass" class="py-0 ml-1 mr-0" style="max-width: fit-content">
          <v-list-item-title class="mb-0 display-1 text-truncate" style="1.4rem; display: inline-block; max-width: 130px">
            {{ mitClass.name }}
          </v-list-item-title>

          <!-- margin-left is necessary because, by default, Vuetify doesn't align the title and subtitle properly when they're different fonts -->
          <v-list-item-subtitle class="text-truncate" style="margin-left: 2px; display: inline-block; max-width: 130px">
            {{ mitClass.description }}
          </v-list-item-subtitle>
        </v-list-item-content>
        <v-icon class="black--text"> 
          mdi-menu-down
        </v-icon>
      </v-list-item>
    </template>

    <template v-if="!user.email">
      <v-card>  
        <v-card-title class="text-subtitle-1 font-weight-medium px-4 pb-2 d-flex">
          <v-divider/><p class="mx-2 my-0 text--secondary">Sign in with</p><v-divider/>
        </v-card-title>
        <v-card-text>
          <v-btn @click="$_logInWithTouchstone()" 
              large outlined color="green" block class="mt-2"
            >
            <v-list-item-title>
              <v-icon class="mr-1" style="margin-bottom: 2px">mdi-school</v-icon>
              MIT 
            </v-list-item-title>
          </v-btn>

          <v-btn @click="$_logInWithGoogle()" 
            large block color="cyan" outlined class="mt-2"
          >
            <v-icon class="mr-1">mdi-google</v-icon>
            Google 
          </v-btn>
        </v-card-text>
      </v-card>

         <!-- <v-list-item class="d-flex" v-if="false">
          <BasePopupButton actionName="Sign up with email" 
            :inputFields="['first name', 'last name', 'email', 'password']" 
            @action-do="user => $_signUp(user)"
          >
            <template v-slot:activator-button="{ on }">
              <v-list-item v-on="on" large class="grey darken-1 white--text">
                <v-icon class="mr-2">mdi-email</v-icon>
                SIGNUP
              </v-list-item>
            </template>

            <template v-slot:message-to-user>
              Email sign-up is a back-up option if you have trouble with MIT Touchstone. 
              To prevent unexpected behavior, use a <u>non-MIT</u> email address to sign up. 
            </template>
          </BasePopupButton>

          <BasePopupButton actionName="Log in with email" 
            :inputFields="['email', 'password']" 
            @action-do="user => $_logIn(user)"
          >
            <template v-slot:activator-button="{ on }">
              <v-list-item v-on="on" large class="grey darken-1 white--text">
                <v-icon class="mr-2">mdi-email</v-icon>
                LOGIN
              </v-list-item>
            </template>
          </BasePopupButton>
        </v-list-item> -->
    </template>

    <!-- Expanded list of classes -->
    <v-list v-else style="overflow-y: auto; max-height: 350px;">
      <template v-for="mitClass in userClasses">
        <v-list-item v-if="mitClass.id !== $route.params.class_id"
          :key="mitClass.id"
          @click="switchClass(mitClass)"
          three-line
        >
          <v-list-item-content>
            <v-list-item-title class="font-weight-bold">
              {{ mitClass.name }}
            </v-list-item-title>
            <v-list-item-subtitle v-text="mitClass.description" class="text--primary"/>
            <!-- `v-text` handles text-truncate on behalf of you, as well as other things -->
            <v-list-item-subtitle v-text="mitClass.numOfMembers + ' members'"/>
          </v-list-item-content>

          <v-list-item-action>
            <v-btn @click.stop.prevent="leaveClass(mitClass.id)" icon>
              <v-icon>mdi-exit-run</v-icon>
            </v-btn>
          </v-list-item-action>
        </v-list-item>
        <v-divider :key="mitClass.id + 'divider'"/>
      </template>

      <CurrentClassNewPopupSearchBar 
        :items="mitClasses"
        @submit="newVal => join({ mitClass: newVal })" 
        color="accent"
        class="mx-2 mt-2"
      />
      <!--     
      <slot name="add-join-leave-class">

      </slot> -->
    </v-list>
  </v-menu>
</template>

<script>
import { mapState} from 'vuex'
import db from '@/database.js'
import DatabaseHelpersMixin from '@/mixins/DatabaseHelpersMixin.js'
import BasePopupButton from '@/components/BasePopupButton.vue'
import AuthHelpers from '@/mixins/AuthHelpers.js'
import CurrentClassNewPopupSearchBar from '@/components/CurrentClassNewPopupSearchBar.vue'
import firebase from 'firebase/app'

export default {
  mixins: [
    DatabaseHelpersMixin,
    AuthHelpers
  ],
  components: {
    BasePopupButton,
    CurrentClassNewPopupSearchBar
  },
  data () {
    return {
      isMenuOpen: false,
      mitClasses: []
    }
  },
  computed: {
    ...mapState([
      'user',
      'mitClass'
    ]),
    userClasses () {
      const out = []
      for (const mitClass of this.mitClasses) {
        for (const userClass of this.user.enrolledClasses) {
          if (mitClass.id === userClass.id) {
            out.push(mitClass)
          }
        }
      }
      return out
    }
  },
  async created () {
    this.mitClasses = await this.$_getCollection(db.collection("classes")); 
  },
  methods: {
    async join ({ mitClass }) {    
      console.log('join mitClass =', mitClass)
      // don't allow duplicate joins
      for (const userClass of this.user.enrolledClasses) {
        if (userClass.id === mitClass.id) {
          this.$root.$emit('show-snackbar', `You are already in ${mitClass.name}`)
          return 
        }
      }

      db.doc(`users/${this.user.uid}`).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayUnion(mitClass),
        mostRecentClassID: mitClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayUnion(mitClass.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayUnion(mitClass.id)
      });

      db.doc(`classes/${mitClass.id}`).update({
        numOfMembers: firebase.firestore.FieldValue.increment(1)
      })

      this.$root.$emit("show-snackbar", `Successfully joined ${mitClass.name}.`);
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}/room/${mitClass.id}`);
    },
    switchClass (mitClass) {
      const userRef = db.doc(`users/${this.$store.state.user.uid}`);
      userRef.update({
        mostRecentClassID: mitClass.id
      });
      this.$router.push(`/class/${mitClass.id}/section/${mitClass.id}/room/${mitClass.id}`);
    },
    async leaveClass (id) {
      const { user } = this; 
      let classToRemove = null; 
      for (const enrolledClass of user.enrolledClasses) {
        if (enrolledClass.id === id) {
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

      db.doc(`classes/${classToRemove.id}`).update({
        numOfMembers: firebase.firestore.FieldValue.increment(-1)
      })

      await db.collection("users").doc(user.uid).update({
        enrolledClasses: firebase.firestore.FieldValue.arrayRemove(classToRemove),
        mostRecentClassID: newDefaultRedirectedClass.id,
        emailOnNewQuestion: firebase.firestore.FieldValue.arrayRemove(classToRemove.id),
        emailOnNewReply: firebase.firestore.FieldValue.arrayRemove(classToRemove.id)
      });
      
      // It's no longer necessary to redirect the class afterwards because the user can only leave classes they are not currently in
      // const newID = newDefaultRedirectedClass.id; 
      // this.$router.push(`/class/${newID}/section/${newID}/room/${newID}`);
    }
  }
}
</script>