<template>
    <v-layout justify-center row>
        <v-dialog max-width="600px" persistent v-model="value">
            <v-card>
                <v-card-text>
                    <v-container grid-list-md>
                        <v-layout wrap>
                            <v-flex xs12>
                                <v-text-field label="Email" required v-model="email"/>
                            </v-flex>
                            <v-flex v-if="newAccount" xs12>
                                <v-text-field
                                        label="Password"
                                        required
                                        type="password"
                                        v-model="password"
                                        v-on:keyup.enter="$emit('create-account', { email,  password })"
                                />
                            </v-flex>
                            <v-flex v-else xs12>
                                <v-text-field
                                        label="Password"
                                        required
                                        type="password"
                                        v-model="password"
                                        v-on:keyup.enter="$emit('sign-in', { email,  password })"
                                />
                            </v-flex>
                            <!-- <v-flex xs12 v-if="newAccount">
                              <v-text-field v-model="nickname" label="Nickname" required/>
                            </v-flex> -->
                        </v-layout>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn @click="$emit('input', !value)" color="blue darken-1" text>
                        CANCEL
                    </v-btn>
                    <v-btn @click="$emit('sign-in', { email,  password })" color="blue darken-1" text>
                        LOG IN
                    </v-btn>
                    <v-btn @click="$emit('create-account', { email,  password })" color="purple" text>
                        CREATE ACCOUNT
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-layout>
</template>

<script>
    export default {
        props: {
            value: Boolean,
            newAccount: Boolean
        },
        data: () => ({
            email: '',
            password: '',
            nickname: ''
        }),
        methods: {
            handleLogin() {
                this.$emit('login', {email: this.email, password: this.password})
            }
        }
    }
</script>