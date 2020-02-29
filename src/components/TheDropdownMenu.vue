<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" :close-on-content-click="false" :nudge-width="200" offset-x>
      <template v-slot:activator="{ on }">
        <slot :on="on">

        </slot>
      </template>
      <v-card>
        <v-card-title>
          <h3>{{ `${user.firstName} ${user.lastName}`}}</h3>
        </v-card-title>
        <v-card-actions>
          <v-btn block text color="accent lighten-1" @click="$emit('sign-out')">Sign Out</v-btn>
        </v-card-actions>
        <v-divider></v-divider>

        <!-- <v-list>
          <v-list-item-title>Email frequency</v-list-item-title>
        </v-list> -->
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

      </v-card>
    </v-menu>
  </div>
</template>

<script>
// pre-condition: user is defined
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