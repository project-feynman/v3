<template>
  <v-card>
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
        <v-tab key="lastTab">
        New Content
      </v-tab>

        <v-tab
          v-for="(tab, i) in tabs"
          :key="i"
        >
          {{ tab }}
        </v-tab>
      </template>

 
    </v-tabs>
    <v-card-text class="text-center">
      <v-btn 
        v-if="isEditting"
        @click="handleSave()"
        text 
      >
        SAVE CHANGES
      </v-btn>
      <v-btn text v-else @click="isEditting = true">EDIT TABS</v-btn>
      <template v-if="isEditting">
        <v-btn text @click="addTab()">Add Tab</v-btn>
        <v-btn text @click="removeTab()">Remove Tab</v-btn>
      </template>
      <!-- <v-divider class="mx-4" vertical></v-divider> -->
    </v-card-text>

    <v-tabs-items v-model="tab">
          <!-- EVERYTHING -->
      <v-tab-item>
        <beta-gallery :tabNumber="0"></beta-gallery>
      </v-tab-item>

      <v-tab-item
        v-for="(tab, i) in tabs"
        :key="`tab-item--${i}`"
      > 
        <!-- <slot> -->
          <h1>{{ i }}</h1>
          <beta-gallery v-if="tab == i" :tabNumber="i+1"></beta-gallery>
        <!-- </slot> -->
      </v-tab-item>
    </v-tabs-items>
  </v-card>
</template>

<script>
import BetaGallery from "@/components/BetaGallery.vue"
  export default {
    props: {
      tabs: {
        type: Array,
        // default () {
        //   return ["tab1", "tab2", "tab3"]
        // }
      }
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
        if (this.localTabs != this.tabs) {
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