<template>
    <v-layout justify-center row>
        <v-dialog max-width="600px" persistent v-model="value">
            <v-card>
                <!-- <v-card-title>
                  <span class="headline">New Class</span>
                </v-card-title> -->
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout justify-center wrap>
                            <v-flex xs12>
                                <v-text-field label="Course Number" placeholder="e.g. 6.006, 6.036"
                                              required v-model="courseNumber"></v-text-field>
                            </v-flex>
                        </v-layout>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="$emit('input', !value)" color="blue darken-1" text>Cancel</v-btn>
                    <v-btn @click="createClass()" color="blue darken-1" text>Create</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
    export default {
        props: {
            value: Boolean
        },
        data() {
            return {
                courseNumber: ''
            }
        },
        methods: {
            createClass() {
                this.$emit('input', !this.value);
                this.$emit('create-class', this.courseNumber)
            }
        }
    }
</script>