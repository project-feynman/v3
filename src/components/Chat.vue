<template>
  <div class="chat">
    <v-card>
        <v-card-title>
          <v-layout>
            <h3>{{ owner }}</h3>
            <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
          </v-layout>
        </v-card-title>

        <v-card-text>
          <v-layout>
            <span class="teal--text">Richard:</span>
            <span class="grey--text text--darken--3 mx-1">Hello, I'm having trouble using the MGF to calculate the variance</span>
          </v-layout>
          <span class="grey--text time">6:00 pm, Jan 1st</span>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-form v-model="valid"  class="mx-2" style="width: 100%">
            <v-text-field
              v-model="name"
              label="New message"
              required
            ></v-text-field>
          </v-form>
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
.time {
	display: block;
	font-size: 0.8em;
}

</style>
