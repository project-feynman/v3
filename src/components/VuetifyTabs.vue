<template>
  <v-card color="rgb(225, 233, 247)">
    <v-tabs
      v-model="tab"
      background-color="red lighten-2"
      dark
    >
      <template v-if="isEditting">
        <v-flex xs6 sm4 md2 v-for="(tab, i) in localTabs" :key="`v-flex-${i}`">
          <v-text-field
            :label="`Tab ${i}`"
            :value="tab"
            @input="newValue => updateTabName(newValue, i)"
          ></v-text-field>
        </v-flex>   
      </template>
      <template v-else>
        <v-tab key="firstTab">
          NEW
        </v-tab>
        <v-tab v-for="(tab, i) in tabs" :key="i">
          {{ tab }}
        </v-tab>
        <v-spacer></v-spacer>
      </template>
    </v-tabs>

    <v-card-text class="text-center">
      <template v-if="isEditting">
        <v-btn @click="handleSave()">SAVE CHANGES</v-btn>
        <v-btn @click="addTab()">ADD TAB</v-btn>
        <v-btn @click="removeTab()">REMOVE TAB</v-btn>
      </template>
      <v-btn v-else @click="isEditting = true">EDIT TABS</v-btn>
    </v-card-text>

    <v-tabs-items v-model="tab">
      <v-tab-item>
        <beta-gallery :tabNumber="0" :tabs="tabs"></beta-gallery>
      </v-tab-item>

      <v-tab-item v-for="(tab, i) in tabs" :key="`tab-item--${i}`"> 
        <beta-gallery :tabNumber="i+1" :tabs="tabs"></beta-gallery>
        <!-- </slot> -->
      </v-tab-item>
    </v-tabs-items>

  </v-card>
</template>

<script>
import BetaGallery from "@/components/BetaGallery.vue"
  export default {
    props: {
      tabs: Array
    },
    components: {
      BetaGallery
    },
    data: () => ({
      tab: null,
      isEditting: false,
      localTabs: []
    }),
    created () {
      this.localTabs = [...this.tabs]
    },
    methods: {
      handleSave () {
        this.isEditting = false
        if (this.localTabs !== this.tabs) {
          console.log("updating tabs")
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

<style>

</style>