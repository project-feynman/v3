<template>
  <v-banner sticky light color="cyan lighten-1 white--text" class="elevation-5"
    style="z-index: 10000000000000"
  >
    Someone invited you to explain something...
    <template v-slot:actions>
      <v-btn @click="redirectToNewRoom()">Accept</v-btn>
      <v-btn @click="$emit('input', false)">Decline</v-btn>
    </template>

    <v-progress-linear
      :value="percentageTimeRemaining"
      reverse
      class="mt-5"
      color="purple"
    />
  </v-banner>
</template>

<script>
export default {
  props: {
    redirectURL: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      percentageTimeRemaining: 100,
      countdownTimer: null,
      unreassignableURL: ''
    }
  },
  created () {
    // inviteRequestURL can be overwritten by newer requests, but we want first-come, first-served, so we use just the initial value
    this.unreassignableURL = this.redirectURL
    this.gentleAlarm = new Audio(require('@/assets/alarm_gentle.wav'))
    this.gentleAlarm.volume = 0.75
    this.gentleAlarm.play()
    this.countdownTimer = setInterval(
      () => {
        console.log('this.percentageTimeRemaining =', this.percentageTimeRemaining)
        this.percentageTimeRemaining -= 5
        if (this.percentageTimeRemaining === 0) {
          this.$emit('input', false)
        }
      },
      1000
    )
  },
  destroyed () {
    this.gentleAlarm.pause()
    clearInterval(this.countdownTimer)
  },
  methods: {
    redirectToNewRoom () {
      this.$router.push(this.unreassignableURL)
      this.$emit('input', false)
    }
  }
}
</script>
