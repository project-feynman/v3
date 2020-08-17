<template>
	<v-card :class="['chat-card', value ? '': 'd-none']">
		<v-app-bar dense color="accent lighten-1" dark>
			<v-icon left>mdi-chat</v-icon>
            <v-toolbar-title>Messages</v-toolbar-title>
            <v-spacer/>
            <v-icon @click="$emit('on-closed')">mdi-close</v-icon>
		</v-app-bar>
		<div class ="chat-container-wrapper">
            <div class="chat-container">
                    <div class="message" v-for="(message,i) in sortedMessages" v-bind:key="i" >
                            <div class="name-display" v-if="(i == 0 || sortedMessages[i-1].creator.uid != message.creator.uid) && user.uid !== message.creator.uid">
                                    {{user.uid === message.creator.uid ? "Me" : message.creator.firstName+ " " + message.creator.lastName}}
                            </div>
                            <div :class="['content', user.uid === message.creator.uid ? 'current-user': '']" style="margin-top: 5px">
                                    <div v-text="message.content"></div>
                            </div> 
                    </div>
            </div>
		</div>
		<div class="text-box-container d-flex">
			<v-col class="text-container py-0 pr-0">
				<v-textarea 
						rows="1"
						auto-grow
						v-model="currentText" 
						placeholder="Type a message..."
						color="accent"
						v-on:keyup.enter="addMessage(currentText)"
					>
				</v-textarea>
			</v-col>
			<v-col cols="auto" class="submit-btn-container">
				<v-icon style="right: 0px" color='accent'  @click="addMessage(currentText)" >
								mdi-send
				</v-icon>
			</v-col>
		</div>
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
        currentText: "",
        hasInitializedMessages: false
    }),
    computed: {
        ...mapState([
            "user",
            "session"
        ]),
        sessionID () {
			return this.session.currentID;
		},
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
            const isNewMessage = this.sortedMessages.length !== this.chatMessages.length;
            this.sortedMessages = mapSort(
                this.chatMessages,
                (elem) => {
                    return { date: elem.date }
                },
                (a, b) => {
                    return (a.date > b.date) ? 1 : ((a.date < b.date) ? -1 : 0)
                });
            const lastMessage = this.sortedMessages[this.sortedMessages.length-1]
            if (isNewMessage && this.user.uid !== lastMessage.creator.uid && !this.value && this.hasInitializedMessages){
                this.$root.$emit("show-snackbar", `${lastMessage.creator.firstName}: ${lastMessage.content}`);
            }
            this.hasInitializedMessages = true;
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
.chat-card {
	position: absolute;
	bottom: 20px;
	right: 20px;
	width: 350px;
	height: 400px;
	z-index: 100;
	display: flex;
	flex-direction: column;
}
.chat-container-wrapper{
    overflow: auto;
    display:flex; 
    flex-direction:column-reverse;
}
.chat-container-wrapper .chat-container{
    box-sizing: border-box;
    padding: 10px;
    background-color: #f8f8f8;
}
.message{
    margin-bottom: 3px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}
.name-display{
    font-size: 12px;
    font-weight: bold;
    margin-top: 10px;
}
.message .content{
    max-width:270px;
    padding: 5px 8px;
    border-radius: 10px;
    box-shadow: 0 1px 3px 0 rgba(0,0,0,0.2), 0 1px 1px 0 rgba(0,0,0,0.14), 0 2px 1px -1px rgba(0,0,0,0.12);
    display: inline-block;
    word-break: break-word;
    hyphens: auto;
		background: white;
}
.message .content.current-user{
  align-self: flex-end;
	background: #ddd;
}
.text-box-container{
	display: flex;
	align-items: center;
}

</style>
<style>
.text-box-container .v-text-field__details {
	display: none;
}
</style>