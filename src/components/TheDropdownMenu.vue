<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" offset-x>
      <template v-slot:activator="{ on }">
        <slot :on="on">

        </slot>
      </template>
      <v-card v-if="user">
        <v-card-title>
          <h3>{{ `${user.firstName} ${user.lastName}`}}</h3>
        </v-card-title>
        <v-card-actions>
          <v-btn block text color="accent" @click="$emit('sign-out')">Sign Out</v-btn>
        </v-card-actions>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn block text color="accent" @click="showDialog=true">Email Preferences</v-btn>
        </v-card-actions>

      </v-card>
    </v-menu>
    <v-dialog v-model="showDialog" scrollable transition="slide-y-transition" max-width="500">
      <v-card>
        <v-card-title>
        Email Preferences
        <v-spacer/>
        <v-btn icon outlined @click="showDialog = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        </v-card-title>
        <v-card-text>
          
          <v-list>
            <v-list-item v-for="mitClass in user.enrolledClasses" :key="mitClass.id">
              <v-container class="px-0">
                <v-list-item-title class="font-weight-bold pr-0">{{ mitClass.name }}</v-list-item-title>
                <v-list-item-action>
                  <v-radio-group v-model="mitClass.notifFrequency" row>
                    <v-radio v-for="option in NotifFrequency"
                      :key="option" :label="option" :value="option" :id="option"
                      @change="classNotifChanged(mitClass, option)"
                      color="accent"
                    />
                  </v-radio-group>
                </v-list-item-action>
              </v-container>
            </v-list-item>
          </v-list>
        </v-card-text>
      </v-card>
    </v-dialog>
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
    showDialog: true,
    NotifFrequency
  }),
  computed: {
    user () { 
      return this.$store.state.user; 
    }
  },
  methods: {
    handleSave () {
      this.menu = false;
      const updatedUser = {
        useDarkMode: this.useDarkMode
        // color: this.color
      };
      if (this.name) { updatedUser.name = this.name; }
      else { updatedUser.name = this.user.name; }
      this.$emit("save", updatedUser);
    },
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