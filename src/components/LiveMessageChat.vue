<template>
    <v-container>
        <template v-for="(message,i) in chatMessages">
            <v-row :key="i">
                {{message.creator}}
            </v-row>
        </template>
        <v-text-field v-model="currentText">
        </v-text-field>
        <v-btn @click="addMessage()">
        </v-btn>
    </v-container>
</template>

<script>
// TODO: Fix search; Allow user to edit; Fix the strange nesting
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js"; 
import BasePopupButton from "@/components/BasePopupButton.vue";
import { displayDate } from "@/helpers.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";

export default {
    props: {
        roomId: String,
        classId: String,
        roomParticipants: Array
    },
    mixins: [
        DatabaseHelpersMixin
    ],
    components: {
        BasePopupButton
    },
    computed: mapState([
        "user"
    ]),
    data: () => ({
        chatMessages: [],
        snapshotListeners: [],
        messagesRef: null,
        currentText: ""
    }),
    created () {
        this.messagesRef = db.collection(`classes/${this.classID}/blackboards/${this.roomId}/messages`);
        $_listenToCollection(this.messagesRef, this, 'chatMessages').then(snapshotListener => {
            this.snapshotListeners.push(snapshotListener);
        });
    },
    beforeDestroy() {
        for (const detachListener of this.snapshotListeners) {
            detachListener();
        }
    },
    methods: {
        addMessage () {
            this.messagesRef.doc(this.user.uid).set({
                creator: this.user
            })
        }
    }
};
</script>