<template>
  <nav>
    <!-- <v-toolbar dark extended extension-height="7">
      <v-toolbar-side-icon></v-toolbar-side-icon>
      <v-toolbar-title class="white--text">Title</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon>
        <v-icon>search</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>apps</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>refresh</v-icon>
      </v-btn>
      <v-btn icon>
        <v-icon>more_vert</v-icon>
      </v-btn>
      <v-progress-linear slot="extension" :indeterminate="true" class="ma-0">Progress?</v-progress-linear>      
    </v-toolbar> -->
    
    <v-toolbar app extended extension-height="2">

      <v-toolbar-side-icon v-if="user" @click="drawerOpen = !drawerOpen"></v-toolbar-side-icon>
      <!-- <router-link to="/"> -->
        <v-toolbar-title @click="$router.push('/')" class="headline text-uppercase">
          18.600
        </v-toolbar-title>
      <!-- </router-link> -->
      <v-spacer></v-spacer>

      <template v-if="user">

        <template v-if="isExplanationPage">

          <v-btn @click="$root.$emit('delete-explanation')" class="red darken-2">
            <span class="white--text">Delete</span>
          </v-btn>

          <v-btn @click="$root.$emit('play-explanation')" class="pink">
            <span class="white--text">Replay</span>
          </v-btn>
        </template>

        <template v-else-if="isStudentPage">
          <v-btn @click="clearQuestion()" class="grey darken-1">
            <span class="white--text">Clear questions</span>
          </v-btn>

          <v-btn :loading="loading2"
                 :disabled="loading2"
                 color="grey darken-1"
                 @click="initClearBoardLogic()">
            <span class="white--text">Clear whiteboard</span>
            <span slot="loader">Clearing...</span>
          </v-btn>
          <popup-button fullscreen :explanationTitle="newTitle" 
                 @input="newValue=> newTitle = newValue" 
                 @pre-save-explanation="handleSaving"
            />
        </template>

      </template>
      <v-progress-linear slot="extension" v-if="isLoading" :indeterminate="true" height="2" class="ma-0"></v-progress-linear>
    </v-toolbar>


    <v-navigation-drawer v-if="user" v-model="drawerOpen" app class="white">
      <v-list>
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Vishesh
        </v-subheader>
 
        <!-- <v-list-tile v-for="student in tables" :key="student['.key']" router :to="`/student/${student['.key']}`"> -->
        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              Visesh is offline
            </span>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Students
        </v-subheader>
     
        <v-list-tile v-for="student in tables" :key="student['.key']" router :to="`/student/${student['.key']}`">
          <v-list-tile-content>
            <v-badge v-if="student.isAskingQuestion" color="red">
              <v-icon slot="badge" dark small>priority_high</v-icon>
              <span>{{ student.owner.name }}</span>
            </v-badge>
            <template v-else>
              {{ student.owner.name }}
            </template>
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Concepts
        </v-subheader>
    
        <v-list-tile v-for="explanation in explanations" :key="explanation.text" router :to="`/explanation/${explanation['.key']}`">
          <v-list-tile-content>
            {{ explanation.title }}
          </v-list-tile-content>
        </v-list-tile>

        <v-divider></v-divider>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Examples
        </v-subheader>
        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              (There are no examples yet)
            </span>
          </v-list-tile-content>
        </v-list-tile>

      </v-list>
    </v-navigation-drawer>

  </nav>
</template>

<script>
import { mapState } from 'vuex'
import db from '@/database.js'
import PopupButton from '@/components/PopupButton.vue'

export default {
  components: {
    PopupButton
  },
  computed: {
    ...mapState(['user']),
    isLoading() {
      return this.loadingChatLog || this.loadingAnimation
    }
  },
  data() {
    return {
      currentTable: null,
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
      ],
      clickedButtonStateName: null,
      loading: false,
      loading2: false,
      loading3: false,
      loading4: false,
      loadingChatLog: true, 
      loadingAnimation: true
    }
  },
  async created() {
    this.$binding('students', db.collection('students'))
    await this.$binding('users', db.collection('users'))
    await this.$binding('tables', db.collection('tables'))
    this.$binding('explanations', db.collection('explanations'))
    // quick-fix: if the drawer is open without a delay, the whiteboard doesn't the touch location correctly (it has an offset)
    setTimeout(() => this.drawerOpen = true, 0)
    setTimeout(() => this.isLoading = false, 3000)
  },
  watch: {
    $route: {
      handler: 'updateNavbarButtons',
      immediate: true 
    },
    clickedButtonStateName () {
      const buttonState = this.clickedButtonStateName 
      this[buttonState] = !this[buttonState]
      this.$root.$on('delete-whiteboard-strokes-success', () => this[buttonState] = false)
      this.clickedButtonStateName = null
    }
  },
  methods: {
    clearQuestion() {
      this.updateTableStatus(false)
      this.$root.$emit('clear-chat')
    },
    async updateTableStatus(isAskingQuestion) {
      const tableId = this.$route.params.id
      console.log('tableId =', tableId)
      const tableRef = db.collection('tables').doc(tableId)
      await tableRef.update({
        isAskingQuestion
      })
      console.log('successfully updated table status')
    },
    initClearBoardLogic() {
      this.clickedButtonStateName = 'loading2'
      this.$root.$emit('clear-whiteboard')
    },
    updateNavbarButtons() {
      const path = this.$route.path
      if (path.substring(1, 12) == 'explanation') {
        this.isExplanationPage = true 
        this.isStudentPage = false 
        this.loadingChatLog = true
        this.loadingAnimation = true 
        this.$root.$on('finish-loading-chat-log', () => this.loadingChatLog = false )
        this.$root.$on('finish-loading-animation', () => this.loadingAnimation = false) 
      } else if (path.substring(1, 8) == 'student') {
        this.isExplanationPage = false 
        this.isStudentPage = true
        // quick-fix
        this.loadingChatLog = false 
        this.loadingAnimation = false 
        this.$binding('currentTable', db.collection('tables').doc(this.$route.params.id))
      } else {
        this.isExplanationPage = false 
        this.isStudentPage = false
        // quick-fix 
        this.loadingChatLog = false 
        this.loadingAnimation = false 
      }



    },
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
