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
      <v-card-title>
        <span class="headline">
          {{ actionName }}
        </span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <slot name="message-to-user">

          </slot>

          <slot name="popup-content" :closePopup="resetState">
            <v-row>
              <v-col v-for="field in inputFields" cols="12" :key="field">
                <v-text-field
                  v-model="inputValues[field]"
                  :label="field"
                  :type="field"
                  :data-qa="field"
                  required
                />
              </v-col>
            </v-row>
          </slot>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer/>
          <v-btn @click="resetState()" color="secondary" text>
            Cancel
          </v-btn>
          
          <slot name="popup-action-buttons">
            <v-btn v-if="actionName" @click="doAction()" color="secondary" text :data-qa='actionName'>
              {{ actionName }}
            </v-btn>
          </slot>
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
      default: () => []
    },
    // TODO: everything below should be naturally passed to the v-button
    color: {
      type: String,
      default: () => "accent"
    },
    outlined: {
      type: Boolean,
      default: () => false
    },
    disabled: {
      type: Boolean,
      default: () => false
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
