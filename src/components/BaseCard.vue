<template>
    <div>
        <v-card>
            <v-card-title primary-title>
                <v-text-field
                        label="Title"
                        v-if="isEditing" v-model="localTitle"
                />
                <div class="title font-weight-bold" v-else>
                    {{ title }}
                </div>
            </v-card-title>

            <v-card-subtitle>
                {{ subtitle }}
            </v-card-subtitle>

            <v-img :aspect-ratio="16/9">
                <slot name="card-image">

                </slot>
            </v-img>

            <v-expand-transition>
                <div v-show="show">
                    <v-divider></v-divider>
                    <!-- IF EDITTING -->
                    <template v-if="isEditing">
                        <v-textarea
                                :value="description"
                                @change="newValue => localDescription = newValue"
                                class="px-3"
                                label="Description"
                                name="input-7-1"
                        />
                        <div v-if="tabs">
                            <v-radio-group @change="newValue => updateLocalTabValue(newValue)" v-model="radioGroup">
                                <v-radio
                                        :key="i"
                                        :label="tab" :value="i"
                                        class="pl-3"
                                        v-for="(tab, i) in tabs">
                                </v-radio>
                            </v-radio-group>
                        </div>
                    </template>

                    <!-- ELSE -->
                    <template v-else>
                        <v-card-text>{{ description || "No description." }}</v-card-text>
                    </template>
                </div>
            </v-expand-transition>

            <v-card-actions>
                <template v-if="isEditing">
                    <v-btn @click="event => handleSave(event)" class="subtitle-2" color="secondary" text>
                        SAVE CHANGES
                    </v-btn>
                    <slot name="card-actions-editing">

                    </slot>
                </template>
                <template v-else>
                    <slot name="card-actions">

                    </slot>
                    <v-spacer/>
                    <v-btn @click="show = !show" icon>
                        <v-icon>{{ show ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
                    </v-btn>
                </template>
            </v-card-actions>

        </v-card>
    </div>
</template>

<script>
    export default {
        props: {
            tabs: Array,
            tabNumber: Number,
            numberOfTabs: Number,
            title: String,
            subtitle: String,
            imageURL: String,
            description: String,
        },
        data: () => ({
            isEditing: false,
            show: false,
            localTitle: "",
            localDescription: "",
            localTabNumber: 0,
            radioGroup: 1
        }),
        created() {
            this.localTitle = this.title;
            this.localDescription = this.description;
            this.localTabNumber = this.tabNumber;
            this.radioGroup = this.tabNumber
        },
        methods: {
            updateLocalTabValue(newValue) {
                this.localTabNumber = newValue
            },
            emitAction(event) {
                event.stopPropagation();
                this.$emit("action", event.target.innerText)
            },
            startEdit() {
                this.isEditing = true;
                this.show = true
            },
            handleSave(event) {
                event.stopPropagation();
                this.isEditing = false;
                this.$emit("save-tab-number", this.localTabNumber);
                this.$emit("save-paragraph", {title: this.localTitle, paragraph: this.localDescription})
            }
        }
    }
</script>
