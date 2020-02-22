<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" offset-x>
      <template v-slot:activator="{ on }">
        <slot :on="on">

        </slot>
      </template>
      <v-card>
        <v-list>
          <v-list-item>
            <v-list-item-title>Notification settings</v-list-item-title>
            <!-- <v-list-item-avatar>
              <v-icon large :color="color">account_circle</v-icon>
            </v-list-item-avatar> -->

            <!-- <v-list-item-content>
              <v-text-field
                placeholder="Enter your name here"
                :value="user.name"
                @input="value => name = value"
                single-line
              />
            </v-list-item-content> -->

            <v-list-item-action>
              <v-btn :class="fav ? 'red--text' : ''" icon @click="fav = !fav">
                <!-- <v-icon>favorite</v-icon> -->
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <v-list>
          <v-list-item v-for="mitClass in user.enrolledClasses" :key="mitClass.id">
            <v-container>
              <v-list-item-title>{{ mitClass.name }}</v-list-item-title>
              <v-list-item-action>
                <v-radio-group v-model="mitClass.notifFrequency" row>
                  <v-radio v-for="option in notifFrequencyEnum"
                    :key="option" :label="option" :value="option" :id="option"
                    @change="classNotifChanged(mitClass, option)"
                  />
                </v-radio-group>
              </v-list-item-action>
            </v-container>
          </v-list-item>
        </v-list>
        <v-card-actions>
          <v-btn color="primary" text @click="handleSave()">Save</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" text @click="$emit('sign-out')">Sign Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import CONSTANTS from "@/CONSTANTS.js";

export default {
  data: () => ({
    fav: true,
    menu: false,
    name: "",
    useDarkMode: false,
    color: "",
    notifFrequencyEnum: CONSTANTS.notifFrequencyEnum
  }),
  computed: {
    user () { return this.$store.state.user; }
  },
  methods: {
    handleSave () {
      this.menu = false;
      const updatedUser = {
        useDarkMode: this.useDarkMode
        // color: this.color
      };
      if (this.name) { updatedUser.name = this.name; }
      else updatedUser.name = this.user.name;
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