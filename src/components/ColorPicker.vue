<template>
  <v-color-picker 
    :value="color"
    @update:color="$emit('update:color', $event)"
    hide-canvas
    hide-mode-switch
  />
</template>

<script>
  export default {
    props: {
      color: {
        type: String, // hex code representation
        default () {
          return '#FF00FF';
        }
      }
    }
  };
</script>

<style lang="scss">
// $color-picker-slider-height: 20px; doesn't work
</style>

<style>
.v-color-picker__controls {
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-orient: vertical;
    -webkit-box-direction: normal;
    -ms-flex-direction: column;
    flex-direction: column;
    padding: 16px;
    padding-top: 16px;
    padding-bottom: 16px; 
    padding-right: 0px;
    padding-left: 16px;
    width: 180px;
}

/* Make the redundant UI invisible */
.v-color-picker__edit {
  visibility: hidden; 
  height: 0;
  margin: 0
}

.theme--light.v-color-picker .v-color-picker__dot, .theme--light.v-color-picker .v-color-picker__color {
  width: 0;
  margin: 0;
}

.v-color-picker__preview {
  display: flex;
  width: 150px;
}
</style>