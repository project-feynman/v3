<template>
  <div class="text-xs-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :nudge-width="200"
      offset-x
    >
      <template v-slot:activator="{ on }">
        <slot :on="on">
        
        </slot>
      </template>

      <v-card>
        <v-list>
          <v-list-tile avatar>
            <v-list-tile-avatar>
              <v-icon large :color="color">
                account_circle
              </v-icon>
              <!-- <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John"> -->
            </v-list-tile-avatar>
            
   
            <v-list-tile-content>
               <v-text-field
                    placeholder="Enter your name here"
                    :value="user.name"
                    @input="value => name = value"
                    single-line
              ></v-text-field>
              <!-- <v-list-tile-sub-title>Founder of Vuetify.js</v-list-tile-sub-title> -->
            </v-list-tile-content>

            <v-list-tile-action>
              <v-btn
                :class="fav ? 'red--text' : ''"
                icon
                @click="fav = !fav"
              >
                <!-- <v-icon>favorite</v-icon> -->
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </v-list>

        <v-divider></v-divider>

        <v-list>
            <!-- <swatches 
                    :color="user.color"
                    @input="value => color = value"
                    :colors="colors"
                    :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', marginLeft: '0px', height: '30px' }"
                    inline
                    background-color="rgba(0, 0, 0, 0)"
                    swatch-size="30"/> -->

          <v-list-tile>
            <v-list-tile-action>
              <v-switch v-model="message" color="purple"></v-switch>
            </v-list-tile-action>
            <v-list-tile-title>Enable notifications</v-list-tile-title>
          </v-list-tile>

          <v-list-tile>
            <v-list-tile-action>
              <v-switch :value="user.useDarkMode" @change="value => useDarkMode = value" color="purple"></v-switch>
            </v-list-tile-action>
            <v-list-tile-title>Enable dark mode</v-list-tile-title>
          </v-list-tile>
        </v-list>

        <v-card-actions>
          <!-- <v-spacer></v-spacer> -->

          <!-- <v-btn flat @click="menu = false">Cancel</v-btn> -->
          <v-btn color="primary" flat @click="handleSave()">Save</v-btn>
          <v-spacer></v-spacer>
          <v-btn color="grey" flat @click="$emit('sign-out')">Sign Out</v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
import Swatches from 'vue-swatches'
import 'vue-swatches/dist/vue-swatches.min.css'

  export default {
    props: {
      user: Object
    },
    components: {
      Swatches
    },
    data: () => ({
      fav: true,
      menu: false,
      message: false,
      name: "",
      useDarkMode: false,
      color: "",
      colors: ["black", "grey", "red", "orange", "yellow", "green", "blue", "purple"]
    }),
    methods: {
      handleSave () {
        this.menu = false 
        const updatedUser = {
          useDarkMode: this.useDarkMode,
          // color: this.color
        }
        if (this.name) {
          updatedUser.name = this.name
        } else {
          updatedUser.name = this.user.name
        }
        this.$emit("save", updatedUser)
      }
    }
  }
</script>