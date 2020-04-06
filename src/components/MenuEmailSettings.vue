<template>
  <div class="text-xs-center">
    <v-menu
      v-model="menu" 
      close-on-content-click 
      :nudge-width="200" 
      offset-x
    >
      <template v-slot:activator="{ on }">
        <slot name="activator" :on="on">

        </slot>
      </template>
      <v-card>
        <v-list v-if="user">
          <template v-for="mitClass in user.enrolledClasses">
            <v-list-item v-if="mitClass.id === $store.state.mitClass.id" :key="mitClass.id">
              <v-container class="px-0">
                <v-list-item-title class="font-weight-bold pr-0">{{ mitClass.name }}</v-list-item-title>
                <v-list-item-action>
                  <v-radio-group v-model="mitClass.notifFrequency" row>
                    <v-radio v-for="option in NotifFrequency"
                      :key="option" 
                      :label="option" 
                      :value="option" 
                      :id="option"
                      @change="classNotifChanged(mitClass, option)"
                      color="accent"
                    />
                  </v-radio-group>
                </v-list-item-action>
              </v-container>
            </v-list-item>
          </template>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import { NotifFrequency } from "@/CONSTANTS.js";

export default {
  data: () => ({
    fav: true,
    menu: false,
    name: "",
    useDarkMode: false,
    color: "",
    showDialog: false,
    NotifFrequency
  }),
  computed: {
    user () { 
      return this.$store.state.user; 
    },
    mitClass () {
      return this.$store.state.mitClass;
    }
  },
  methods: {
    classNotifChanged ({ name, id }, notifFrequency) {
      const updateArray = this.user.enrolledClasses;
      for (let i = 0; i < updateArray.length; i++) {
        if (updateArray[i].id === id) {
          updateArray[i] = { name, id, notifFrequency };
        }
      }
      this.$emit("settings-changed", updateArray);
    }
  }
};
</script>