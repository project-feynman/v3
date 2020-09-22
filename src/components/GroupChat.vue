<template>
  <div>
    <template>
      <div class="text-center">
        <v-menu
          v-model="menu"
          :close-on-content-click="false"
          :nudge-width="250"
          offset-x
          offset-y
        >
          <!-- Activator Button -->
          <template v-slot:activator="{ on, attrs }">
            <v-badge overlap :value="false">
              <v-btn
                color="white"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon class="mr-2">mdi-chat</v-icon>
                Chats
              </v-btn>
            </v-badge>
          </template>

          <!-- POPUP: NEW GROUP CHANNEL -->
          <v-dialog v-model="isGroupRoomPopupOpen"> 
            <v-card>
              <v-card-title>
                Create new public channel
              </v-card-title>

              <v-card-text>
                <v-text-field placeholder="Type the new group name here..." v-model="newGroupName"/>
              </v-card-text>

              <v-card-actions>
                <v-spacer/>
                <v-btn @click="isGroupRoomPopupOpen = false">CANCEL</v-btn>
                <v-btn @click="createNewGroupRoom(); isGroupRoomPopupOpen = false;">
                  CREATE NEW CHANNEL
                </v-btn>
              </v-card-actions> 
            </v-card>
          </v-dialog>

          <!-- POPUP: NEW DM -->
          <v-dialog v-model="isDmRoomPopupOpen"> 
            <v-card>
              <v-card-title>
                New direct message
              </v-card-title>

              <v-card-text>
                <!-- TODO: change to name as not everybody knows each other's Kerberos -->
                <!-- return object means payload from @change will be the object
                even though the display name is just object.name -->

                <h2 v-if="allExplainUsers.length === 0">
                  Fetching all class members...(could take a while)
                </h2>

                <v-autocomplete v-else
                  :items="allClassmates"
                  :filter="filterByNameAndOrEmail"
                  @change="newUser => createNewDirectMessageRoom({ targetUser: newUser })"
                  return-object 
                  prepend-inner-icon="mdi-magnify"
                  placeholder="Type a name/email *perfectly* e.g. Peter or padour@mit.edu"
                  color="accent" 
                  outlined 
                  clearable 
                  elevate="2"
                  ref="VAutocomplete"
                >
                  <template v-slot:item="{ item }">
                    {{ item.firstName }} {{ item.lastName }} ({{ item.email }})
                  </template>
                </v-autocomplete>
              </v-card-text>

              <v-card-actions>
                <v-spacer/>
                <!-- No buttons, simply go off the dropdown -->
                <v-btn @click="isDmRoomPopupOpen = false">CANCEL</v-btn>
              </v-card-actions> 
            </v-card>
          </v-dialog>

          <!-- ACTUAL CHATS WINDOW IS DEFINED HERE -->
          <v-card width="600" height="500"> 
            <v-row class="mx-0">
              <v-col cols="5" class="pa-0">
                <v-card>
                  <!-- GROUP CHANNELS --> 
                  <v-list>
                    <v-row class="mx-0">
                      <v-list-item-title class="headline">
                        Public channels
                      </v-list-item-title>
                      <v-btn @click="isGroupRoomPopupOpen = true" icon>
                        <v-icon>mdi-plus</v-icon>
                        <!-- Create new channel -->
                      </v-btn>

                      <!-- <v-btn>
                        Join existing channel
                      </v-btn> -->
                    </v-row>
                    
                    <template v-for="room in groupRooms">
                      <v-list-item :key="room.id" @click="currentChatRoomID = room.id">
                        {{ room.name }}
                      </v-list-item>
                      <v-divider/>
                    </template>
                  </v-list>
                  
                  <!-- DIRECT MESSAGES -->
                  <v-list>
                    <v-row class="mx-0">
                      <v-list-item-title class="headline">
                        Direct messages
                      </v-list-item-title>
                      <v-btn @click="handleOpenDmPopup()" icon>
                        <v-icon>mdi-plus</v-icon>
                      </v-btn>
                    </v-row>

                    <template v-for="room in dmRooms">
                      <v-list-item @click="currentChatRoomID = room.id" :key="room.id">
                        {{ getOtherPerson(room).firstName + " " + getOtherPerson(room).lastName }}
                      </v-list-item>
                      <v-divider/>
                    </template>
                  </v-list>
                </v-card>
              </v-col> 

              <v-col cols="7">
                <FullyDisplayedChat v-if="currentChatRoomID" 
                  :chatRoomID="currentChatRoomID"
                  :key="currentChatRoomID"
                />
              </v-col>
            </v-row>
          </v-card>
        </v-menu>
      </div>
    </template>
  </div>
</template>

<script>
import db from "@/database.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import FullyDisplayedChat from "@/components/FullyDisplayedChat.vue";
import { mapState } from "vuex"; 
import firebase from "firebase/app";
import "firebase/firestore";
import { getRandomId } from "@/helpers.js";

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    FullyDisplayedChat
  },
  data () {
    return {
      groupRooms: [],
      dmRooms: [],
      menu: false,
      currentChatRoomID: "",
      isDmRoomPopupOpen: false,
      isGroupRoomPopupOpen: false,
      allExplainUsers: [],
      newDmUserObj: {},
      newGroupName: ""
    };
  },
  computed: {
    ...mapState([
      "user",
      "mitClass"
    ]),
    classRef () {
      return db.doc(`classes/${this.mitClass.id}`); 
    },
    myBasicUserInfo () {
      return {
        firstName: this.user.firstName,
        lastName: this.user.lastName,
        email: this.user.email,
        uid: this.user.uid
      };
    },
    allClassmates () {
      return this.allExplainUsers.filter(user => {
        for (const classObj of user.enrolledClasses) {
          if (classObj.id === this.$route.params.class_id) {
            return true; 
          }
        }
        return false; 
      });
    }
  },
  created () {
    // simply fetch all the rooms
    this.$_bindVarToDB({
      varName: "groupRooms",
      dbRef: db.collection(`${this.classRef.path}/chatRooms`).where("isGroupRoom", "==", true),
      component: this
    });
    this.$_bindVarToDB({
      varName: "dmRooms",
      dbRef: db.collection(`${this.classRef.path}/chatRooms`).where("participants", "array-contains", this.myBasicUserInfo),
      component: this
    });
  },
  methods: {
    filterByNameAndOrEmail ({ firstName, lastName, email }, queryText, itemText) {
      return [firstName, lastName, email].includes(queryText);
    },
    getOtherPerson ({ participants }) {
      if (participants[0].uid === this.user.uid) {
        return participants[1]; 
      } else {
        return participants[0]; 
      }
    },
    async handleOpenDmPopup () {
      this.isDmRoomPopupOpen = true; 
      if (this.allExplainUsers.length === 0) {
        // quickfix so allExplainUsers isn't a promise when used by the template
        const temp = await this.$_getCollection(db.collection("users").orderBy("firstName"));
        this.allExplainUsers = temp; 
      }
    },
    createNewGroupRoom () {
      const newRoomID = getRandomId(); 
      db.doc(`${this.classRef.path}/chatRooms/${newRoomID}`).set({
        name: this.newGroupName,
        isGroupRoom: true
      });
    },
    async createNewDirectMessageRoom ({ targetUser }) {
      if (!targetUser) return; // quickfix for when the user selects a duplicate DM and the autocomplete does not properly reset its state
      const newRoomID = getRandomId(); 
      const himOrHer = {
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        email: targetUser.email,
        uid: targetUser.uid
      };

      // check if the user already exists within my dmRooms 
      for (const room of this.dmRooms) {
        for (const p of room.participants) {
          if (p.uid === himOrHer.uid) {
            this.$root.$emit("show-snackbar", "You already are talking to this person");
            return; 
          }
        }
      }

      await db.doc(`${this.classRef.path}/chatRooms/${newRoomID}`).set({
        participants: [this.myBasicUserInfo, himOrHer]
      });

      // cleanup
      this.isDmRoomPopupOpen = false; 
    }
  }
};
</script>