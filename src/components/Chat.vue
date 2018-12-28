<template>
  <div class="chat">
    <v-card>
        <v-card-title>
          <div>
            <v-layout>
              <h3>{{ owner }}</h3>
              <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
            </v-layout>
            <div>Hello, I'm having trouble using the MGF to calculate the variance</div>
          </div>
        <v-form v-model="valid">
          <v-text-field
            v-model="name"
            :rules="nameRules"
            :counter="10"
            label="New message"
            required
          ></v-text-field>
        </v-form>
        </v-card-title>

        <v-card-actions>
          <v-btn flat color="orange">Share</v-btn>
          <v-btn flat color="orange">Explore</v-btn>
        </v-card-actions>
    </v-card>
  </div>
</template>

<script>
export default {
  props: ['owner'],
  data: () => ({
    valid: false,
    name: '',
    nameRules: [
      v => !!v || 'Name is required',
      v => v.length <= 10 || 'Name must be less than 10 characters'
    ],
    email: '',
    emailRules: [
      v => !!v || 'E-mail is required',
      v => /.+@.+/.test(v) || 'E-mail must be valid'
    ]
  }),
  mounted() {
    console.log('owner =', this.owner)
  }
}
</script>

<style>
.user-online {
  color: green;
}
</style>
