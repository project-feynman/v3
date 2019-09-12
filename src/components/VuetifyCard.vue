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
            <div class="display-1">{{ title }}</div>
            <span class="subheading grey--text">{{ description }}</span>
          </div>
        </v-card-title>

        <v-card-actions>
          <v-btn v-for="button in actionButtons" :key="button" @click="e => emitAction(e)" flat color="secondary">
            {{ button }}
          </v-btn>
          <!-- EDITTING -->
          <template v-if="hasPermission">
            <v-btn v-if="!isEditting" @click="startEdit()" flat>EDIT</v-btn>
            <v-btn v-else-if="isEditting" @click="event => handleSave(event)" flat>SAVE</v-btn>
            <v-btn @click="e => emitAction(e)" flat color="red">delete</v-btn>
          </template>
          
          <!--  OLD IMPLEMENTATION -->
          <v-spacer></v-spacer>

          <!-- <v-btn v-if="hasDeleteButton" color="red" icon @click="show = !show">
            <v-icon class="white--text" @click="e => emitAction(e)">delete</v-icon>
          </v-btn> -->


          <div class="flex-grow-1"></div>
          <v-btn
            icon
            @click="show = !show"
    
          >
            <v-icon color="black">{{ show ? 'expand_less' : 'expand_more' }}</v-icon>
          </v-btn>
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
                  name="input-7-1"
                  :value="paragraph"
                  @change="newValue => localParagraph = newValue"
                  ref="paragraph"
                ></v-textarea>
              
              </template>
            </div>
        </v-slide-y-transition>
      </v-card>
      </div>
</template>

<script>
export default {
  props: {
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
    show: false,
    localParagraph: '',
    isEditting: false
  }),
  created () {
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