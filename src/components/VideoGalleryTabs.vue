<template>
    <v-card>
        <!-- EDIT MODE -->
        <template v-if="user && isEditting">
            <v-tabs background-color="red lighten-1" dark v-model="tab">
                <v-flex :key="`v-flex-${i}`" md2 sm4 v-for="(tab, i) in localTabs" xs6>
                    <v-text-field
                            :label="`Tab ${i}`"
                            :value="tab"
                            @input="newValue => updateTabName(newValue, i)"
                    ></v-text-field>
                </v-flex>
            </v-tabs>
            <v-card-text class="text-center">
                <v-btn @click="handleSave()">SAVE CHANGES</v-btn>
                <v-btn @click="addTab()">ADD TAB</v-btn>
                <v-btn @click="removeTab()">REMOVE TAB</v-btn>
            </v-card-text>
        </template>

        <!-- NORMAL MODE -->
        <template v-else>
            <v-tabs :value="tab" @change="newValue => $emit('tab-change', newValue)" background-color="red lighten-1"
                    dark>
                <v-tab :key="i" v-for="(tab, i) in tabs">
                    {{ tab }}
                </v-tab>
                <v-spacer/>
            </v-tabs>
            <v-card-text class="text-center">
                <v-btn @click="isEditting = true" v-if="user">
                    EDIT TABS
                </v-btn>
            </v-card-text>
        </template>

        <!-- TAB ITEMS -->
        <v-tabs-items v-model="tab">
            <slot v-bind:tabs="tabs">
                <!-- SLOT -->
            </slot>
        </v-tabs-items>
    </v-card>
</template>

<script>
    export default {
        props: {
            tab: Number,
            tabs: Array
        },
        data: () => ({
            isEditting: false,
            localTabs: []
        }),
        computed: {
            user() {
                return this.$store.state.user
            }
        },
        created() {
            this.localTabs = [...this.tabs]
        },
        methods: {
            handleSave() {
                this.isEditting = false;
                if (this.localTabs !== this.tabs) {
                    this.$emit('tabs-rename', this.localTabs)
                }
            },
            addTab() {
                this.localTabs.push("")
            },
            removeTab() {
                this.localTabs.pop()
            },
            updateTabName(newValue, i) {
                Vue.set(this.localTabs, i, newValue)
            }
        }
    }
</script>