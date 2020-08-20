<template>
  <!-- Commented out z-index so dropdown menus will show, but now tabs are submerged-->
  <v-card >
    <v-navigation-drawer 
      :value="value" @input="newVal => $emit('input', newVal)" 
      app 
      width="380"
      class="the-side-drawer"
    >    
      <TheSideDrawerSpaces
        :roomParticipantsMap="roomParticipantsMap"
      />
    </v-navigation-drawer>
  </v-card>
</template>

<script>
import TheSideDrawerSpaces from "@/components/TheSideDrawerSpaces.vue";

import { mapState } from "vuex";

export default {
  props: {
    value: Boolean,
    roomParticipantsMap: Object
  },
  components: {
    TheSideDrawerSpaces
  },
  data () {
    return {
      activeTab: "rooms"
    }
  },
  computed: { 
    ...mapState([
      "user",
      "mitClass"
    ])
  }
};
</script>

<style scoped>
.blackboard-item .active-count {
  font-size: 0.85em;
}
.blackboard-item .active-blackboard-users {
  display: none;
}
.blackboard-item.active-blackboard .active-count {
  display: none;
}
.blackboard-item.active-blackboard .active-blackboard-users {
  display: block;
}
.side-tabs {
  position: sticky;
  top: 0;
  z-index: 1;
}
.the-side-drawer {
  z-index: 8;
  max-width: 75%;
}
</style>
