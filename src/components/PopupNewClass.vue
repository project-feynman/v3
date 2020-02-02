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
                <v-text-field v-model="className" placeholder="e.g. 6.006, 6.036" label="Class Name" required></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="$emit('input', !value)" color="blue darken-1" text >Cancel</v-btn>
          <v-btn @click="createClass()" color="blue darken-1" text>Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
export default {
  props: {
    value: Boolean
  },
  data () {
    return {
      className: ''
    }
  },
  methods: {
    createClass () {
      this.$emit('input', !this.value)
      this.$emit('create-class', this.className)
    }
  }
}
</script>