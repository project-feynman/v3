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
          <v-form style="width: 100%">
            <v-text-field
              v-model="message"
              box
              clear-icon="mdi-close-circle"
              clearable
              label="Write a message..."
              type="text"
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
    password: 'Password',
    show: false,
    message: 'Hey!',
    marker: true,
    iconIndex: 0,
    icons: [
      'mdi-emoticon',
      'mdi-emoticon-cool',
      'mdi-emoticon-dead',
      'mdi-emoticon-excited',
      'mdi-emoticon-happy',
      'mdi-emoticon-neutral',
      'mdi-emoticon-sad',
      'mdi-emoticon-tongue'
    ]
  }),

  computed: {
    icon () {
      return this.icons[this.iconIndex]
    }
  },

  methods: {
    toggleMarker () {
      this.marker = !this.marker
    },
    sendMessage () {
      this.resetIcon()
      this.clearMessage()
    },
    clearMessage () {
      this.message = ''
    },
    resetIcon () {
      this.iconIndex = 0
    },
    changeIcon () {
      this.iconIndex === this.icons.length - 1
        ? this.iconIndex = 0
        : this.iconIndex++
    }
  }
}
</script>
</script>

<style>
.time {
	display: block;
	font-size: 0.8em;
}

</style>
