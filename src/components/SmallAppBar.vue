<template>
  <v-app-bar class="mb-4">
    <img src="/logo.png" @click="$router.push('/')" height="40" class="pl-2" style="cursor: pointer;"/>
    
    <v-toolbar-title v-if="mitClass" :class="['headline', 'ml-2']">
      {{ mitClass.name }}
    </v-toolbar-title>

    <v-spacer/>

    <slot>

    </slot>

    <!-- Library of saved explanations -->
    <v-dialog v-model="showLibrary">
      <template v-slot:activator="{ on, attrs }">
        <BaseButton 
          :on="on"
          icon="mdi-bookshelf"
          v-bind="attrs"
          small
          filled
          color="accent"
        >
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
}
</script>
