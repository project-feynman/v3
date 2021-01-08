<template>
  <div>
    <portal to="side-drawer">
      <v-list nav class="pa-0">
        <template v-for="roomType in sortedRoomTypes">
          <!-- accent-text counterintuitively gives the orange shading and NOT the orange text-->
          <!-- :inactive prop is necessary because otherwise, the user can click it to go into a void (without being in a room) -->
          <!-- id is used for scrollToView() -->
          <v-list-item :key="roomType.id"
            :to="(`/class/${classID}/section/${roomType.id}`)"
            active-class="accent--text"
            class="px-0" 
            :inactive="sectionID === roomType.id"
            :id="`${ sectionID === roomType.id ? 'space-title' : '' }`"
          >
            <!--  color: ${ sectionID === roomType.id ? '#ff5b24' : '#424242' };  -->
            <v-list-item-content class="py-0">
              <div style="display: flex; align-items: center;" class="pt-2">
                <div class="ml-4">
                  <div v-if="roomType.id !== sectionID" 
                    style="
                      font-size: 0.95rem; 
                      font-weight: 500; 
                      color: '#424242'; 
                      opacity: 20%;
                      text-transform: uppercase;
                  ">
                    {{ roomType.name }}
                  </div>
                  <portal-target v-else name="room-type-name">

                  </portal-target>
                </div>

                <v-spacer/>

                <portal-target v-if="sectionID === roomType.id"
                  name="current-open-space-actions"
                  :key="roomType.id + 'actions-portal'"
                >
                  
                </portal-target>
              </div>

              <portal-target v-if="sectionID === roomType.id" 
                name="currently-active-open-space" 
                :key="roomType.id + 'rooms-portal'"
              >

              </portal-target>
            </v-list-item-content>
          </v-list-item>
        </template>
        
        <BasePopupButton v-if="sortedRoomTypes.length !== 0"
          actionName="Create a new area"
          :inputFields="['name']" 
          @action-do="({ name }) => createNewRoomType(name)"
        >
          <template v-slot:activator-button="{ on }">
            <v-list-item v-on="on" style="font-weight: 500; opacity: 20%; font-size: 0.95rem;">
              <v-icon class="ml-1 mr-2 black--text">mdi-plus</v-icon>
              <div style="color: '#424242'">NEW AREA</div>
            </v-list-item>
          </template> 
        </BasePopupButton>
      </v-list>
    </portal>
  </div>
</template>

<script>
import db from "@/database.js"; 
import { getRandomId } from "@/helpers.js"; 
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import BaseButton from "@/components/BaseButton.vue";
import ClassLibrary from "@/pages/ClassLibrary.vue";
import BasePopupButton from "@/components/BasePopupButton.vue"; 
import { mapState, mapGetters } from "vuex";

export default {
  name: "AllOpenSpaces",
  mixins: [
    DatabaseHelpersMixin
  ],
  components: {
    ClassLibrary,
    BaseButton,
    BasePopupButton
  },
  data () {
    return {
      roomTypes: [],
    };
  },
  computed: {
    ...mapState([ "mitClass" ]),
    ...mapGetters([ "isAdmin" ]),
    classID () { return this.$route.params.class_id; },
    sectionID () { return this.$route.params.section_id; },
    classDocRef () { return db.doc(`classes/${this.classID}`); },
    sortedRoomTypes () {
      return [
        ...this.roomTypes.filter(roomType => roomType.id === this.$route.params.class_id),
        ...this.roomTypes.filter(roomType => roomType.id !== this.$route.params.class_id)
      ];
    }
  },
  async created () {
    // fetch once for light bandwidth usage
    this.roomTypes = await this.$_getCollection(this.classDocRef.collection("roomTypes")); 
    await this.$nextTick(); 
    document.getElementById("space-title").scrollIntoView({ 
      behavior: "smooth", block: "nearest" 
    });
  },
  methods: {
     /**
     * Create a new roomType, and initialize it with a common room, which is initialized with a blackboard
     */
    async createNewRoomType (name) {
      const { class_id } = this.$route.params; 
      const id = getRandomId(); 
      const ref = db.doc(`classes/${class_id}`);
      await Promise.all([
        ref.collection("roomTypes").doc(id).set({ id, name }),
        ref.collection("rooms").doc(id).set({
          isCommonRoom: true,
          roomTypeID: id,
          blackboards: [id]
        }),
        ref.collection("blackboards").doc(id).set({})
      ]);
      this.$root.$emit("show-snackbar", "Successfully created new open space.")
      this.$router.push(`/class/${class_id}/section/${id}`);
    }
  }
}
</script>