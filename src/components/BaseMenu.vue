<template>
    <div class="text-xs-center">
        <v-menu
                :close-on-content-click="false"
                :nudge-width="200"
                offset-x
                v-model="menu"
        >
            <template v-slot:activator="{ on }">
                <slot :on="on">

                </slot>
            </template>

            <v-card>
                <v-list>
                    <v-list-item>
                        <v-list-item-avatar>
                            <v-icon :color="color" large>
                                account_circle
                            </v-icon>
                            <!-- <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John"> -->
                        </v-list-item-avatar>


                        <v-list-item-content>
                            <v-text-field
                                    :value="user.name"
                                    @input="value => name = value"
                                    placeholder="Enter your name here"
                                    single-line
                            ></v-text-field>

                        </v-list-item-content>

                        <v-list-item-action>
                            <v-btn
                                    :class="fav ? 'red--text' : ''"
                                    @click="fav = !fav"
                                    icon
                            >
                                <!-- <v-icon>favorite</v-icon> -->
                            </v-btn>
                        </v-list-item-action>
                    </v-list-item>
                </v-list>

                <v-divider></v-divider>

                <v-list>
                    <v-list-item>
                        <v-list-item-action>
                            <v-switch color="purple" v-model="message"></v-switch>
                        </v-list-item-action>
                        <v-list-item-title>Enable notifications</v-list-item-title>
                    </v-list-item>

                </v-list>

                <v-card-actions>
                    <!-- <v-spacer></v-spacer> -->

                    <!-- <v-btn flat @click="menu = false">Cancel</v-btn> -->
                    <v-btn @click="handleSave()" color="primary" text>Save</v-btn>
                    <v-spacer></v-spacer>
                    <v-btn @click="$emit('sign-out')" color="grey" text>Sign Out</v-btn>
                </v-card-actions>
            </v-card>
        </v-menu>
    </div>
</template>

<script>
    import Swatches from 'vue-swatches'
    import 'vue-swatches/dist/vue-swatches.min.css'

    export default {
        props: {
            user: Object
        },
        components: {
            Swatches
        },
        data: () => ({
            fav: true,
            menu: false,
            message: false,
            name: "",
            useDarkMode: false,
            color: "",
            colors: ["black", "grey", "red", "orange", "yellow", "green", "blue", "purple"]
        }),
        methods: {
            handleSave() {
                this.menu = false;
                const updatedUser = {
                    useDarkMode: this.useDarkMode,
                    // color: this.color
                };
                if (this.name) {
                    updatedUser.name = this.name
                } else {
                    updatedUser.name = this.user.name
                }
                this.$emit("save", updatedUser)
            }
        }
    }
</script>