<template>
    <v-card>
        <v-navigation-drawer 
            :value="value" @input="newVal => $emit('input', newVal)" 
            right
            app
            clipped
            width="380"
            class="the-side-drawer">  
        <div class ="chat-container-wrapper">
            <div class="chat-container">
                <div class="message" v-for="(message,i) in sortedMessages" v-bind:key="i" >
                    <div class="name-display" v-if="i == 0 || sortedMessages[i-1].creator.uid != message.creator.uid">
                        {{user.uid === message.creator.uid ? "Me" : message.creator.firstName+ " " + message.creator.lastName}}
                    </div>
                    <div style="margin-top: 5px"></div>
                    <div class="content">
                        <div v-text="message.content"></div>
                    </div> 
                </div>
            </div>
        </div>
        <v-text-field v-model="currentText" @keydown.enter="addMessage(currentText)" placeholder="Type a message...">
            <v-btn color='accent' slot="append" @click="addMessage(currentText)" >
                Send
                <v-icon class="pl-2">mdi-send</v-icon>
            </v-btn>
        </v-text-field>
        
        </v-navigation-drawer>
    </v-card>
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
        value: Boolean,
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
        addMessage (text) {
            if (!text) { return; }
            const messageID = getRandomId();
            const date = new Date().toISOString();
            this.messagesRef.doc(messageID).set({
                id: messageID,
                creator: this.simplifiedUser,
                content: text,
                date: date
            });
            this.currentText = "";
        },
        displayDate (date) {
            return displayDate(date);
        }
    }
};
</script>

<style scoped>
.chat-container-wrapper{
    /* height: calc(100vh - 9.5rem); */
    overflow: auto;
    display:flex; 
    flex-direction:column-reverse;
}
.chat-container-wrapper .chat-container{
    box-sizing: border-box;
    padding: 10px;
    background-color: #f2f2f2;
}
.message{
    margin-bottom: 3px;
    width:300px;
}
.name-display{
    font-size: 12px;
    font-weight: bold;
}
.chat-container .content{
    padding: 8px;
    border-radius: 10px;
    display:inline-block;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12);
    display: inline-block;
    word-break: break-word;
    hyphens: auto;
}
.the-side-drawer {
    z-index: 7;
    max-width: 75%;
}
</style>