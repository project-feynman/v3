<template>
  <v-tooltip bottom>
    <template v-slot:activator="{ on }">
      <v-btn
        v-if="stopPropagation"
        v-on="on"
        @click.stop="$emit('click')"
        outlined
        :color="color"
        :class="['icon-button px-0 mx-1 align-center justify-center', small ? 'small' : '']"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
      <v-btn 
        v-else 
        v-on="on" 
        @click="$emit('click')" 
        outlined 
        :color="color" 
        :class="['icon-button px-0 mx-1 align-center justify-center', small ? 'small' : '']">
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>
      <slot></slot>
    </span>
  </v-tooltip>
</template>

<script>
export default {
  props: {
    icon: {
      type: String,
      default () {
        return 'none'
      }
    },
    color: {
      type: String,
      default () {
        return 'accent'
      }
    },
    stopPropagation: {
      type: Boolean,
      default () {
        return true
      }
    },
    small: {
      type: Boolean,
      default () {
        return false
      }
    },
  }
}
</script>

<style>
.icon-button {
  height: 40px !important;
  width: 40px !important;
  display: inline-flex;
  border-radius: 50%;
}
.icon-button.small {
  height: 34px !important;
  width: 34px !important;
}
</style>