<template>
  <v-layout row justify-center>
    <v-dialog v-model="value" persistent max-width="600px">
      <!-- <v-btn slot="activator" color="primary" dark>Open Dialog</v-btn> -->
      <v-card>
        <v-card-title>
          <span class="headline">Login Form</span>
        </v-card-title>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field v-model="email" label="Email" required></v-text-field>
              </v-flex>
              <v-flex xs12>
                <v-text-field v-model="password" label="Password" type="password" required></v-text-field>
              </v-flex>
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click="$emit('input', !value)">
            CANCEL
          </v-btn>
          <v-btn color="blue darken-1" flat @click="$emit('sign-up', { email,  password })">
            SIGN UP
          </v-btn>
          <v-btn color="blue darken-1" flat @click="$emit('sign-in', { email,  password })">
            SIGN IN
          </v-btn>
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
  data: () => ({
    email: '',
    password: ''
  }),
  methods: {
    handleLogin() {
      this.$emit('login', { email: this.email, password: this.password })
    }
  }
}
</script>