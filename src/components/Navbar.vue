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
            <span class="white--text">Delete</span>
          </v-btn>

          <v-btn @click="$root.$emit('play-explanation')" class="pink">
            <span class="white--text">Replay</span>
          </v-btn>
        </template>

        <template v-else-if="isStudentPage">
          <!-- <v-btn @click="updateTableStatus(!currentTable.isAskingQuestion)" class="grey darken-1">
            <span v-if="!currentTable.isAskingQuestion" class="white--text">Request help</span>
            <span v-else class="white--text">Resolve request</span>
          </v-btn> -->

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

    </v-toolbar>
    <v-navigation-drawer v-model="drawerOpen" app class="white">
      <v-list>
        <v-subheader class="subheading black--text text-uppercase font-weight-black">
          Vishesh
        </v-subheader>
        <v-divider></v-divider>
        <!-- <v-list-tile v-for="student in tables" :key="student['.key']" router :to="`/student/${student['.key']}`"> -->
        <v-list-tile>
          <v-list-tile-content>
            <span class="grey--text text--darken--3 mx-1">
              Visesh is offline
            </span>
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Students
        </v-subheader>
        <v-divider></v-divider>
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
    ...mapState(['user'])
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
      loading4: false
    }
  },
  async created() {
    this.$binding('students', db.collection('students'))
    await this.$binding('users', db.collection('users'))
    await this.$binding('tables', db.collection('tables'))
    this.$binding('explanations', db.collection('explanations'))
    // quick-fix: if the drawer is open without a delay, the whiteboard doesn't the touch location correctly (it has an offset)
    await setTimeout(() => this.drawerOpen = true, 0)
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
      } else if (path.substring(1, 8) == 'student') {
        this.isExplanationPage = false 
        this.isStudentPage = true
        this.$binding('currentTable', db.collection('tables').doc(this.$route.params.id))
      } else {
        this.isExplanationPage = false 
        this.isStudentPage = false
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
