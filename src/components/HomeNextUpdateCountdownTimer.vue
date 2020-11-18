<template>
  <p>
    {{ minutes + ":" + seconds }}
  </p>
</template>

<script>
export default {
  data () {
    return {
      minutes: null,
      seconds: null,
      timer: null
    };
  },
  created () {
    const fiveMinutes = 60 * 5; 
    this.startTimer(fiveMinutes); 
  },
  methods: {
    // TODO: make it days and minutes rather than seconds
    startTimer (duration) {
      this.timer = duration; 
      setInterval(() => {
        this.minutes = parseInt(this.timer / 60, 10)
        this.seconds = parseInt(this.timer % 60, 10);

        this.minutes = this.minutes < 10 ? "0" + this.minutes : this.minutes;
        this.seconds = this.seconds < 10 ? "0" + this.seconds : this.seconds;

        if (--this.timer < 0) {
            this.timer = duration;
        }
      }, 1000);
    }
  }
};
</script>