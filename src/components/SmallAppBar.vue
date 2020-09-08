<template>
  <v-app-bar height="75" flat color="white">
    <img src="/logo.png" @click="$router.push('/')" height="40" class="pl-2" style="cursor: pointer;"/>
    
    <v-app-bar-title v-if="mitClass" :class="['headline', 'ml-3', 'black--text', 'text--secondary']">
      {{ mitClass.name }}
    </v-app-bar-title>

    <v-spacer/>

    <slot>

    </slot>

    <!-- Class Library -->
    <v-dialog v-model="showLibrary">
      <template v-slot:activator="{ on, attrs }">
        <BaseButton :on="on" icon="mdi-bookshelf" v-bind="attrs" small filled color="accent">
          Library
        </BaseButton>
      </template>

      <ClassLibrary/>
    </v-dialog>
  </v-app-bar>
</template>

<script>
import { mapState } from "vuex"; 
import ClassLibrary from "@/pages/ClassLibrary.vue";
import BaseButton from "@/components/BaseButton.vue";

export default {
  components: {
    BaseButton,
    ClassLibrary
  },
  computed: mapState(["mitClass"]),
  data () {
    return {
      showLibrary: false
    };
  }
};
</script>
