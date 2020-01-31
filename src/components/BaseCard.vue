<template>
  <div>
    <v-card class="d-flex flex-column" style="cursor: pointer;"> 
      <div @click="handleTitleClicked()">

        <v-card-title primary-title >
          <v-text-field 
            v-if="isEditing" 
            v-model="localTitle" label="Title"
          />
          <div v-else class="title font-weight-bold">
            {{ title }}
          </div>
        </v-card-title>

        <v-card-subtitle >
          {{ subtitle }}
        </v-card-subtitle>
        
        <v-card-text v-if="!show" style="text-overflow: ellipsis; 
                            overflow: hidden; 
                            white-space: nowrap;">
          {{ description || "No description." }}
        </v-card-text>
        <v-card-text v-else >
          {{ description || "No description." }}
        </v-card-text>

      </div>

      <!-- <v-btn icon @click="show = !show" style="align-self: flex-end">
            <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
      </v-btn> -->

      <v-img :aspect-ratio="16/9">
        <slot name="card-image">
          
        </slot> 
      </v-img>

      <v-expand-transition>
        <div v-show="show">
          <!-- <v-divider></v-divider> -->
          <!-- IF EDITTING -->
          <template v-if="isEditing">
            <v-textarea
              class="px-3"
              name="input-7-1"
              label="Description"
              :value="description"
              @change="newValue => localDescription = newValue"
            />
            <div v-if="tabs">
              <v-radio-group v-model="radioGroup" @change="newValue => updateLocalTabValue(newValue)">
                <v-radio 
                  v-for="(tab, i) in tabs" 
                  :key="i" :label="tab" 
                  :value="i" 
                  class="pl-3">
                </v-radio>
              </v-radio-group>
            </div>
          </template>
        </div>
      </v-expand-transition>

      <v-card-actions>
        <template v-if="isEditing">
          <v-btn @click="event => handleSave(event)" text color="secondary" class="subtitle-2">
            SAVE CHANGES
          </v-btn>
          <slot name="card-actions-editing">
            
          </slot>
        </template>
        <template v-else>
          <slot name="card-actions">
            
          </slot>
        </template> 
      </v-card-actions>

    </v-card>
  </div>
</template>

<script>
export default {
  props: {
    tabs: Array,
    tabNumber: Number,
    numberOfTabs: Number,
    title: String,
    subtitle: String,
    imageURL: String,
    description: String
  },
  data: () => ({
    isEditing: false,
    show: false,
    localTitle: "",
    localDescription: "",
    localTabNumber: 0,
    radioGroup: 1
  }),
  created () {
    this.localTitle = this.title
    this.localDescription = this.description
    this.localTabNumber = this.tabNumber
    this.radioGroup = this.tabNumber
  },
  methods: {
    updateLocalTabValue (newValue) {
      this.localTabNumber = newValue
    },
    emitAction (event) {
      event.stopPropagation()
      this.$emit("action", event.target.innerText)
    },
    startEdit () {
      this.isEditing = true
      this.show = true
    },
    handleSave (event) {
      event.stopPropagation()
      this.isEditing = false 
      this.$emit("save-tab-number", this.localTabNumber)
      this.$emit("save-paragraph", { title: this.localTitle, paragraph: this.localDescription})
    },
    handleTitleClicked(){
      this.$emit("title-clicked")
    }
  }
}
</script>
