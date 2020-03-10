<template>
  <v-dialog v-model="isOpen" persistent max-width="600px" @keydown.enter="doAction()">
    <template v-slot:activator="{ on }">
      <slot name="activator-button" :on="on"> 
        <v-btn :color="color" :outlined="outlined" :disabled="disabled" v-on="on">
          {{ actionName }}
        </v-btn>
      </slot>
    </template>
    <v-card>
      <v-card-title><span class="headline">{{ actionName }}</span></v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <slot name="message-to-user">

            </slot>
            <template v-for="inputField in inputFields">
              <v-col cols="12" :key="inputField">
                <v-text-field
                  v-model="inputValues[inputField]"
                  :label="inputField"
                  :type="inputField"
                  required
                />
              </v-col>
            </template>
          </v-row>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="resetState()" color="accent" text>
          Cancel
        </v-btn>
        <v-btn @click="doAction()" color="accent" text>
          {{ actionName }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  props: {
    actionName: String,
    inputFields: {
      type: Array,
      default () { return []; }
    },
    color: {
      type: String,
      default () {
        return "accent"
      }
    },
    outlined: {
      type: Boolean,
      default () { return false; }
    },
    disabled: {
      type: Boolean,
      default () { return false; }
    }
  },
  data: () => ({
    isOpen: false,
    inputValues: {}
  }),
  created () {
    for (const inputField of this.inputFields) {
      this.inputValues[inputField] = "";
    }
  },
  methods: {
    doAction () {
      this.$emit("action-do", this.inputValues);
      this.isOpen = false;
      this.resetState();
    },
    resetState () {
      this.inputValues = {};
      this.isOpen = false;
    }
  }
}
</script>
