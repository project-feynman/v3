<template>
      <div>
      <v-card> 
        
        <v-img
          :aspect-ratio="16/9"
        >
        <!-- <v-img
          :src="imageURL"
          :aspect-ratio="16/9"
        > -->
          <slot>
            <canvas id="myCanvas"></canvas>
          </slot> 
        </v-img>
        <v-card-title primary-title>
          <div>
            <div 
              v-if="!isEditting" 
              class="display-1"
            >
              {{ title }}
            </div>
            <v-text-field 
              v-else 
              v-model="localTitle" 
              label="Title"
            >
            </v-text-field>
            <!-- DESCRIPTION -->
            <span class="subtitle-1 grey--text">
              {{ description }}
            </span>
          </div>
        </v-card-title>

        <v-card-actions>
          <v-btn v-for="button in actionButtons" :key="button" 
                 @click="e => emitAction(e)" 
                 text color="secondary" small class="subtitle-2"
          >
            {{ button }}
          </v-btn>
          <!-- EDITTING -->
          <template v-if="hasPermission">
            <v-btn v-if="!isEditting" @click="startEdit()" 
                   text small class="subtitle-2"
            >
              EDIT
            </v-btn>
            <v-btn v-else-if="isEditting" 
                   @click="event => handleSave(event)" 
                   text small class="subtitle-2"
            >
              SAVE CHANGES
            </v-btn>
            <v-btn @click="e => emitAction(e)" 
                   text color="red" small class="subtitle-2"
            >
              DELETE
            </v-btn>
          </template>
          
          <v-spacer></v-spacer>
          <!-- <v-btn v-if="hasDeleteButton" color="red" icon @click="show = !show">
            <v-icon class="white--text" @click="e => emitAction(e)">delete</v-icon>
          </v-btn> -->

          <div class="flex-grow-1"></div>
          <!-- <v-btn
            icon
            @click="show = !show"
          >
            <v-icon color="black">{{ show ? 'expand_less' : 'expand_more' }}</v-icon>
          </v-btn> -->
        </v-card-actions>

         <v-slide-y-transition>
            <div v-show="show">
              <template v-if="!isEditting">
                <v-card-text class="subheading">
                  {{ paragraph }}
                </v-card-text>
              </template>
              <template v-else>
                <v-textarea
                  class="px-3"
                  name="input-7-1"
                  label="Paragraph"
                  :value="paragraph"
                  @change="newValue => localParagraph = newValue"
                  ref="paragraph"
                ></v-textarea>

                  <div v-if="numberOfTabs">
                    <v-radio-group v-model="radioGroup"
                                   @change="newValue => $emit('tab-change', newValue)">
                    <v-radio
                      v-for="n in numberOfTabs"
                      class="pl-3"
                      :key="n"
                      :label="`Tab ${n}`"
                      :value="n"
                    ></v-radio>
                  </v-radio-group>
              </div>
              
              </template>
            </div>
        </v-slide-y-transition>
      </v-card>
      </div>
</template>

<script>
export default {
  props: {
    numberOfTabs: {
      type: Number,
      default () {
        return 3 
      }
    },
    editMode: {
      type: Boolean,
      default () {
        return false
      }
    },
    title: String,
    imageURL: String,
    description: {
      type: String,
      default () {
        return "Explanations move the world forward"
      }
    },
    actionButtons: {
      type: Array,
      default () {
        return ["EXPLORE COURSE", "QUICKPLAY", "FULLSCREEN"]
      }
    },
    hasDeleteButton: {
      type: Boolean,
      default () {
        return false
      }
    },
    paragraph: {
      type: String,
      default () {
        return "ExplainMIT is a website where MIT students share visual explanations"
      }
    },
    hasPermission: {
      type: Boolean,
      default () { return false }
    }
  },
  data: () => ({
    show: true,
    localTitle: '',
    localParagraph: '',
    isEditting: false,
    radioGroup: 1
  }),
  created () {
    this.localTitle = this.title
    this.localParagraph = this.paragraph
  },
  methods: {
    emitAction (event) {
      event.stopPropagation()
      this.$emit("action", event.target.innerText)
    },
    startEdit () {
      this.isEditting = true
      this.show = true
    },
    handleSave (event) {
      event.stopPropagation()
      this.isEditting = false
      // if (!this.localParagraph) {
      //   this.$emit("save-paragraph", this.paragraph)
      // } else {
        this.$emit("save-paragraph", this.localParagraph)
      // }
    }
  }
}
</script>

<style>
.myCanvas {
  width: 100%;
  height: 100%;
}
</style>