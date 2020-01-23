<template>
    <div id="KaryDialog">
        <v-dialog
            v-model="dialog"
            max-width="300">
      <v-card>
        
        <v-card-title class="headline">{{title}}</v-card-title>
        <v-card-text class="headline">{{text}}</v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
            <v-btn v-for="(option, i) in options" :key="i"
                color="green darken-1"
                text
                @click="submit(option)">
                {{option}}
            </v-btn>
        </v-card-actions>

      </v-card>
    </v-dialog>
    </div>
</template>

<script>
export default {
    name: 'KaryDialog',
    data() {
        return {
            dialog : true
        }
    },
    props: ['title', 'text', 'options'],
    methods: {
        submit(choice) {
            this.$emit('submit', choice)
            this.dialog = false
        }
    }
}
</script>