<template>
  <nav>
    <v-toolbar app>

      <v-toolbar-side-icon @click="drawerOpen = !drawerOpen"></v-toolbar-side-icon>

      <v-toolbar-title class="headline text-uppercase">
        <span>18.600</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <template v-if="user">

        <template v-if="isExplanationPage">

          <v-btn @click="$root.$emit('delete-explanation')" class="red darken-2">
            <span class="mr-2 white--text">Delete explanation</span>
          </v-btn>

          <v-btn @click="$root.$emit('play-explanation')" class="pink">
            <span class="mr-2 white--text">Replay explanation</span>
          </v-btn>
        </template>

        <template v-else-if="isStudentPage">
          <v-btn @click="$root.$emit('clear-chat')" class="grey darken-1">
            <span class="mr-2 white--text">Clear chat</span>
          </v-btn>
          <v-btn @click="$root.$emit('clear-whiteboard')" class="grey darken-1">
            <span class="mr-2 white--text">Clear whiteboard</span>
          </v-btn>
          <popup fullscreen :explanationTitle="newTitle" 
                 @input="newValue=> newTitle = newValue" 
                 @pre-save-explanation="handleSaving"
            />
        </template>

      </template>

    </v-toolbar>
    <v-navigation-drawer v-model="drawerOpen" app class="white">
      <v-list>
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Teaching Assistants
        </v-subheader>
        <v-divider></v-divider>
        <!-- <v-list-tile v-for="student in tables" :key="student['.key']" router :to="`/student/${student['.key']}`"> -->
        <v-list-tile>
          <v-list-tile-content>
            (There are currently no TAs here)
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Students
        </v-subheader>
        <v-divider></v-divider>
        <v-list-tile v-for="student in tables" :key="student['.key']" router :to="`/student/${student['.key']}`">
          <v-list-tile-content>
            {{ student.owner.name }}
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Concepts
        </v-subheader>
        <v-divider></v-divider>
        <v-list-tile v-for="explanation in explanations" :key="explanation.text" router :to="`/explanation/${explanation['.key']}`">
          <v-list-tile-content>
            {{ explanation.title }}
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Examples
        </v-subheader>
        <v-list-tile>
          <v-list-tile-content>
            (There are currently no examples here)
          </v-list-tile-content>
        </v-list-tile>

      </v-list>
    </v-navigation-drawer>

  </nav>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import Popup from '@/components/Popup.vue'

export default {
  components: {
    Popup
  },
  computed: {
    ...mapState(['user'])
  },
  data() {
    return {
      users: null,
      newTitle: '',
      students: null,
      tables: null,
      isStudentPage: false, 
      isExplanationPage: false,
      drawerOpen: false,
      explanations: [
        { text: 'Moment Generating Functions' },
        { text: 'Entropy' },
        { text: 'Central Limit Theorem' },
        { text: 'Stationary Distributions' }
      ]
    }
  },
  async created() {
    this.$binding('students', db.collection('students'))
    await this.$binding('users', db.collection('users'))
    await this.$binding('tables', db.collection('tables'))
    this.$binding('explanations', db.collection('explanations'))
    // quick-fix: if the drawer is open without a delay, the whiteboard doesn't the touch location correctly (it has an offset)
    await setTimeout(() => this.drawerOpen = true, 1000)
  },
  watch: {
    $route(to, from) {
      const path = this.$route.path 
      console.log('path =', path)
      if (path.substring(1, 12) == 'explanation') {
        console.log('explanation')
        this.isExplanationPage = true 
        this.isStudentPage = false 
      } else if (path.substring(1, 8) == 'student') {
        console.log('student')
        this.isExplanationPage = false 
        this.isStudentPage = true
      } else {
        console.log('others')
        this.isExplanationPage = false 
        this.isStudentPage = false
      }
    }
  },
  methods: {
    async handleSaving() {
      const docRef = await db.collection('explanations').add({
        title: this.newTitle,
        author: "Richard Feynman"
      })
      this.$root.$emit('save-explanation', docRef.id)
    }
  }
}
</script>
