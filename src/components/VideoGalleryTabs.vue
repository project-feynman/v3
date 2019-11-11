<template>
  <v-card>
    <!-- EDIT MODE -->
    <template v-if="user && isEditting">
      <v-tabs v-model="tab" background-color="blue-grey darken-2" dark>
          <v-flex xs6 sm4 md2 v-for="(tab, i) in localTabs" :key="`v-flex-${i}`">
            <v-text-field
              :label="`Tab ${i}`"
              :value="tab"
              @input="newValue => updateTabName(newValue, i)"
            ></v-text-field>
          </v-flex>   
      </v-tabs>
      <v-card-text class="text-center">
        <v-btn @click="handleSave()">SAVE CHANGES</v-btn>
        <v-btn @click="addTab()">ADD TAB</v-btn>
        <v-btn @click="removeTab()">REMOVE TAB</v-btn>
      </v-card-text>
    </template>

    <!-- NORMAL MODE -->
    <template v-else>
      <v-tabs v-model="tab" background-color="blue-grey darken-2" dark>
        <v-tab v-for="(tab, i) in tabs" :key="i">
          {{ tab }}
        </v-tab>
        <v-spacer/>
      </v-tabs>
      <v-card-text class="text-center">
        <v-btn @click="isEditting = true">
          EDIT TABS
        </v-btn>
      </v-card-text>
    </template>

    <!-- TAB ITEMS -->
    <v-tabs-items v-model="tab">
      <slot v-bind:tabs="tabs"> 
        <!-- SLOT -->
      </slot>
    </v-tabs-items>
  </v-card>
</template>

<script>
export default {
  props: {
    tabs: Array
  },
  data: () => ({
    tab: null,
    isEditting: false,
    localTabs: []
  }),
  computed: {
    user () {
      return this.$store.state.user
    }
  },
  created () {
    this.localTabs = [...this.tabs]
  },
  methods: {
    handleSave () {
      this.isEditting = false
      if (this.localTabs !== this.tabs) {
        this.$emit('tabs-rename', this.localTabs)
      }
    },
    addTab () {
      this.localTabs.push("")
    },
    removeTab () {
      this.localTabs.pop()
    },
    updateTabName (newValue, i) {
      Vue.set(this.localTabs, i, newValue)
    }
  }
}
</script>