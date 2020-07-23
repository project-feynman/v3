<template>
    <v-container>
        <template v-for="(message,i) in sortedMessages">
            <v-row :key="i">
                {{message.creator.firstName}}:
                {{message.text}} ; DATE: {{displayDate(message.date)}}
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
import { getRandomId } from "@/helpers.js";
import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/firestore";
import { mapState } from "vuex";
import mapSort from 'mapsort';

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
    data: () => ({
        chatMessages: [],
        sortedMessages: [],
        snapshotListeners: [],
        messagesRef: null,
        currentText: ""
    }),
    computed: {
        ...mapState([
            "user"
        ]),
        simplifiedUser () {
            return {
                email: this.user.email,
                uid: this.user.uid,
                firstName: this.user.firstName,
                lastName: this.user.lastName,
            }
        }
    },
    watch : {
        chatMessages () {
            console.log("sorting")
            this.sortedMessages = mapSort(
                this.chatMessages,
                (elem) => {
                    return { date: elem.date }
                },
                (a, b) => {
                    return (a.date > b.date) ? 1 : ((a.date < b.date) ? -1 : 0)
	            })
            }
    },
    created () {
        this.messagesRef = db.collection(`classes/${this.classId}/blackboards/${this.roomId}/messages`);
        this.$_listenToCollection(this.messagesRef, this, 'chatMessages').then(snapshotListener => {
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
            const messageID = getRandomId();
            const date = new Date().toISOString()
            this.messagesRef.doc(messageID).set({
                id: messageID,
                creator: this.simplifiedUser,
                text: this.currentText,
                date: date
            })
        },
        displayDate (date) {
            return displayDate(date);
        }
    }
};
</script>