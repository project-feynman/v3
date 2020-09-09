<template>
  <portal to="side-drawer">
    <v-list class="py-0">
      <v-list-item two-line style="padding-left: 24px">
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
      </v-list-item>
      
      <v-divider/>

      <div style="padding-top: 40px; padding-left: 24px; padding-bottom: 12px; font-size: 1.25rem">
        Message Chats
      </div>

      <v-list-item v-for="roomType in roomTypes" :key="roomType.id"
        append :to="(`section/${roomType.id}`)"
        style="padding-left: 24px; padding-right: 24px"
      >
        <v-list-item-content style="font-size: 0.88rem; font-weight: 400; color: #424242; opacity: 81%;">
          {{ roomType.name }}
        </v-list-item-content>

        <v-list-item-action>
          <v-row>
            <!-- <v-btn @click.submit.prevent="editNameOfRoomType()" icon>
              <v-icon color="grey">mdi-pencil</v-icon>
            </v-btn> -->

            <!-- <v-btn v-if="isAdmin" @click.submit.prevent="deleteRoomType(roomType.id)" icon>
              <v-icon color="red">mdi-close</v-icon>
            </v-btn> -->
          </v-row>
        </v-list-item-action>
      </v-list-item>

      <!-- <div v-if="roomTypes !== []">
        <BasePopupButton actionName="Create new open space"
          :inputFields="['name']" 
          @action-do="({ name }) => createNewRoomType(name)"
        >
          <template v-slot:activator-button="{ on }"> -->
            <!-- <BaseButton :on="on" icon="mdi-plus" block color="grey">
              New space
            </BaseButton> -->
            <!-- <v-btn v-if="isAdmin" v-on="on" block text color="grey">
              <v-icon left>mdi-plus</v-icon>
              New open space
            </v-btn>
          </template> 
        </BasePopupButton>
      </div> -->
    </v-list>
  </portal>
</template>

<script>
import ClassLibrary from "@/pages/ClassLibrary.vue"; 

export default {
  data () {
    return {
      showLibrary: false
    };
  }
}
</script>