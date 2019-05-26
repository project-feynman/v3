<template>
  <v-layout row justify-center>
    <v-dialog v-model="value" persistent max-width="600px">
      <v-card>
        <!-- <v-card-title>
          <span class="headline">New Class</span>
        </v-card-title> -->
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap justify-center>
              <v-flex xs12>
                <v-text-field v-model="courseNumber" placeholder="e.g. 6.006, 6.036" label="Course Number" required></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click="$emit('input', !value)">Cancel</v-btn>
          <v-btn color="blue darken-1" flat @click="createClass()">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
export default {
  props: ['value'],
  data () {
    return {
      courseNumber: ''
    }
  },
  methods: {
    createClass () {
      this.$emit('input', !this.value)
      this.$emit('create-class', this.courseNumber)
    }
  }
}
</script>