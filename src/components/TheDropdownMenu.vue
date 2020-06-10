<template>
  <div class="text-xs-center">
    <v-menu v-model="menu" 
      :close-on-content-click="false" 
      :nudge-width="200" 
      offset-x
    >
      <template v-slot:activator="{ on }">
        <slot name="activator" :on="on">

        </slot>
      </template>
      <v-card>
        <template v-if="user">
          <v-card-title v-if="user">
            {{ `${user.firstName} ${user.lastName}` }}
          </v-card-title>
          <v-card-subtitle>
            <p>{{ user.email }}</p>
          </v-card-subtitle>
        </template>
        <v-divider></v-divider>
        <slot name="menu-buttons">

        </slot>
        <v-divider></v-divider>
        <v-card-actions>
          <v-btn block text color="accent" @click="$emit('sign-out')" data-qa="sign-out-btn">Sign Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  data: () => ({
    fav: true,
    menu: false,
    name: "",
    useDarkMode: false,
    color: ""
  }),
  computed: {
    user () { 
      return this.$store.state.user; 
    }
  },
  methods: {
    handleSave () {
      // this.menu = false;
      // const updatedUser = {
      //   useDarkMode: this.useDarkMode
      //   // color: this.color
      // };
      // if (this.name) updatedUser.name = this.name; 
      // else updatedUser.name = this.user.name; 
      // this.$emit("save", updatedUser);
    },
    // classNotifChanged ({ name, id }, notifFrequency) {
    //   const updateArray = this.user.enrolledClasses;
    //   for (let i = 0; i < updateArray.length; i++) {
    //     if (updateArray[i].id === id) {
    //       updateArray[i] = { name, id, notifFrequency };
    //     }
    //   }
    //   this.$emit("settings-changed", updateArray);
    // }
  }
};
</script>