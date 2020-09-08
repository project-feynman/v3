<template>
  <div></div>
  <!-- <v-list-item two-line style="padding-left: 24px">
    <v-list-item-avatar @click="$router.push('/')" tile :width="`${40+3}px`" style="cursor: pointer;" :style="`margin-right: ${16-3}px`">
      <img src="/logo.png">
    </v-list-item-avatar>

    <v-list-item-content>
      <v-list-item-title style="opacity: 80%; font-size: 1.3rem">{{ mitClass.name }}</v-list-item-title>
    </v-list-item-content>

    <v-list-item-action>
      <v-dialog v-model="showLibrary" fullscreen>
        <template v-slot:activator="{ on, attrs }">
          <v-btn v-on="on" v-bind="attrs" tile style="padding: 0 8px">
            <v-icon>mdi-bookshelf</v-icon>
          </v-btn>
        </template>

        <v-toolbar dark>
          <v-btn icon dark @click="showLibrary = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <ClassLibrary/>
      </v-dialog>
    </v-list-item-action>
  </v-list-item> -->
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
