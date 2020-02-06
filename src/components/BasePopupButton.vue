<template>
  <!-- <v-row justify="center"> -->
    <v-dialog v-model="isOpen" persistent max-width="600px">
      <template v-slot:activator="{ on }">
        <v-btn :color="color" :outlined="outlined" :disabled="disabled" v-on="on">{{ actionName }}</v-btn>
      </template>
      <v-card>
        <v-card-title>
          <span class="headline">{{ actionName }}</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
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
          <!-- <small>*indicates required field</small> -->
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="resetState()">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="doAction()">{{ actionName }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  <!-- </v-row> -->
</template>

<script>
export default {
  props: {
    actionName: String,
    inputFields: Array,
    color: String,
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
    },
    resetState () {
      this.inputValues = {};
      this.isOpen = false;
    }
  }
}
</script>