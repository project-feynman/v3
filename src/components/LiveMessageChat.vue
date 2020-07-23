<template>
    <div>
        <div class="chat-container">
            <div class="message" v-for="(message,index) in sortedMessages" v-bind:key="index" :class="{own: message.creator.uid == user.uid}">
                <div class="name-display" v-if="index == 0 || sortedMessages[index-1].creator.uid != message.creator.uid">
                    {{message.creator.firstName+ " " + message.creator.lastName}}
                </div>
                <div style="margin-top: 5px"></div>
                <div class="content">
                    <div v-html="message.content"></div>
                    <!-- <chat-image v-if="message.image" :imgsrc="message.image" @imageLoad="imageLoad"></chat-image> -->
                </div> 
            </div>
        </div>
        <v-text-field v-model="currentText">
        </v-text-field>
        <v-btn @click="addMessage()">
        </v-btn>
    </div>
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
                content: this.currentText,
                date: date
            })
        },
        displayDate (date) {
            return displayDate(date);
        }
    }
};
</script>

<style scoped>
.scrollable {
    overflow-y: auto;
    height: 90vh;
  }
  .typer{
    box-sizing: border-box;
    display: flex;
    align-items: center;
    bottom: 0;
    height: 4.9rem;
    width: 100%;
    background-color: #fff;
    box-shadow: 0 -5px 10px -5px rgba(0,0,0,.2);
  }
  .typer input[type=text]{
    position: absolute;
    left: 2.5rem;
    padding: 1rem;
    width: 80%;
    background-color: transparent;
    border: none;
    outline: none;
    font-size: 1.25rem;
  }
  .chat-container{
    box-sizing: border-box;
    height: calc(100vh - 9.5rem);
    overflow-y: auto;
    padding: 10px;
    background-color: #f2f2f2;
  }
  .message{
    margin-bottom: 3px;
  }
  .message.own{
    text-align: right;
  }
  /* .message.own .content{
    background-color: lightskyblue;
  } */
  .name-display{
    font-size: 12px;
    font-weight: bold;
  }
  .chat-container .content{
    padding: 8px;
    /* background-color: lightgreen; */
    /* border-style: solid; */
    border-radius: 10px;
    /* border-color: rgb(231, 137, 13); */
    display:inline-block;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12);
    max-width: 50%;
    /* word-wrap: break-word; */
    }
</style>