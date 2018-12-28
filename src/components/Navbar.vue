<template>
  <nav>
    <v-toolbar app>

      <v-toolbar-side-icon @click="drawerOpen = !drawerOpen"></v-toolbar-side-icon>
      <v-toolbar-title class="headline text-uppercase">
        <span>Vishesh Jain, 18.600</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>

      <v-btn flat class="grey darken-1">
        <span class="mr-2 white--text">Reset chat</span>
      </v-btn>

      <v-btn flat class="grey darken-1">
        <span class="mr-2 white--text">Reset whiteboard</span>
      </v-btn>

      <v-btn flat class="pink darken-1">
        <span class="mr-2 white--text">Save explanation</span>
      </v-btn>

    </v-toolbar>
    <v-navigation-drawer v-model="drawerOpen" app class="white">
      <v-list>
        
        <v-subheader class="black--text subheading text-uppercase font-weight-black">
          Students
        </v-subheader>
        <v-divider></v-divider>
        <v-list-tile v-for="student in students" :key="student.text" router :to="`/student/${student.text}`">
          <v-list-tile-content>
            {{ student.text }}
          </v-list-tile-content>
        </v-list-tile>

        <v-subheader class="subheading black--text text-uppercase font-weight-black">Explanations</v-subheader>
        <v-divider></v-divider>
        <v-list-tile v-for="explanation in explanations" :key="explanation.text" router :to="`/explanation/${explanation.text}`">
          <v-list-tile-content>
            {{ explanation.text }}
          </v-list-tile-content>
        </v-list-tile>

      </v-list>
    </v-navigation-drawer>
  </nav>
</template>

<script>
export default {
  data() {
    return {
      drawerOpen: false,
      students: [
        { text: 'Alice Liddel', route: '/' },
        { text: 'Bob Marley', route: '/' },
        { text: 'Charles Dickens', route: '/projects' }
      ],
      explanations: [
        { text: 'Moment Generating Functions', route: '/' },
        { text: 'Entropy', route: '/' },
        { text: 'Central Limit Theorem', route: '/' },
        { text: 'Stationary Distributions', route: '/' }
      ]
    }
  }
}
</script>
