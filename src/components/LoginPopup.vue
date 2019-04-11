<template>
  <v-layout row justify-center>
    <v-dialog v-model="value" persistent max-width="600px">
      <v-card>
        <v-card-text>
          <v-container grid-list-md>
            <v-layout wrap>
              <v-flex xs12>
                <v-text-field v-model="email" label="Email" required/>
              </v-flex>
              <v-flex xs12 v-if="newAccount">
                <v-text-field 
                  v-model="password" 
                  v-on:keyup.enter="$emit('create-account', { email,  password })" 
                  label="Password" 
                  type="password" 
                  required
                />
              </v-flex>
              <v-flex xs12 v-else>
                <v-text-field 
                  v-model="password" 
                  v-on:keyup.enter="$emit('sign-in', { email,  password })" 
                  label="Password" 
                  type="password" 
                  required
                />
              </v-flex>
              <!-- <v-flex xs12 v-if="newAccount">
                <v-text-field v-model="nickname" label="Nickname" required/>
              </v-flex> -->
            </v-layout>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" flat @click="$emit('input', !value)">
            CANCEL
          </v-btn>
          <v-btn 
            v-if="newAccount" 
            @click="$emit('create-account', { email,  password })"
            color="blue darken-1" flat 
          >
            CREATE ACCOUNT
          </v-btn>
          <v-btn v-else color="blue darken-1" flat @click="$emit('sign-in', { email,  password })">
            LOG IN
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script>
export default {
  props: {
    value: Boolean,
    newAccount: Boolean
  },
  data: () => ({
    email: '',
    password: '',
    nickname: ''
  }),
  methods: {
    handleLogin() {
      this.$emit('login', { email: this.email, password: this.password })
    }
  }
}
</script>