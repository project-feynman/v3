<template>
  <v-dialog v-model="dialog" max-width="290">
    <v-btn slot="activator" color="primary" dark>SEE QUESTION</v-btn>
    <v-card>
      <v-card-title class="headline">
        <slot name="title">
          Question
        </slot>
      </v-card-title>

      <v-card-text>
        <slot name="text">
          {{ workspace.question }}
        </slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="button">

        </slot>
        <v-btn color="green darken-1" flat @click="dialog = false">OK</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>