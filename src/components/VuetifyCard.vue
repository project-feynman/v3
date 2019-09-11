<template>
      <div>
      <v-card> 
        
        <v-img
          :aspect-ratio="16/9"
        >
        <!-- <v-img
          :src="imageURL"
          :aspect-ratio="16/9"
        > -->
          <slot>
            <canvas id="myCanvas"></canvas>
          </slot> 
        </v-img>
        <v-card-title primary-title>
          <div>
            <div class="display-1">{{ title }}</div>
            <span class="subheading grey--text">{{ description }}</span>
          </div>
        </v-card-title>

        <v-card-actions>
          <v-btn v-for="button in actionButtons" :key="button" @click="e => emitAction(e)" flat color="secondary">
            {{ button }}
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn v-if="hasDeleteButton" color="red" icon @click="show = !show">
            <v-icon class="white--text" @click="e => emitAction(e)">delete</v-icon>
          </v-btn>
        </v-card-actions>

        <!-- <v-slide-y-transition>
          <v-card-text v-show="show" class="subheading">
            The unbearable stress of falling behind irrecoverably, with no path forward. "Nobody has time to explain things to you." "Nobody can help you". That feeling of desolation. When the burden of existence just weighs too much. What I quickly learnt was that an explanation is not just about the knowledge. It's about whether it brings joy and curiosity rather than anguish and hopelessness. It's a fine line between heaven and hell.
          </v-card-text>
        </v-slide-y-transition> -->
      </v-card>
      </div>
</template>

<script>
export default {
  props: {
    title: String,
    description: {
      type: String,
      default () {
        return "Explanations move the world forward"
      }
    },
    actionButtons: {
      type: Array,
      default () {
        return ["EXPLORE COURSE", "QUICKPLAY", "FULLSCREEN"]
      }
    },
    hasDeleteButton: {
      type: Boolean,
      default () {
        return false
      }
    },
    imageURL: String
  },
  data: () => ({
    show: false
  }),
  methods: {
    emitAction (event) {
      event.stopPropagation()
      this.$emit("action", event.target.innerText)
    }
  }
}
</script>

<style>
.myCanvas {
  width: 100%;
  height: 100%;
}
</style>