<template>
  <div class="chat">
    <v-card class="chat-window">
      <v-card-title>
        <v-layout>
          <template v-if="table && user">
            <template v-if="table.owner">
              <template v-if="user.uid != $route.params.id">
                <h3 v-if="user.uid != $route.params.id">{{ table.owner.name }}</h3>
                <v-icon right small color="green" class="mx-2">fiber_manual_record</v-icon>
              </template>
              <h3 v-else>Your workspace</h3>
            </template>
          </template>
        </v-layout>
      </v-card-title>
<<<<<<< HEAD
        
        <template v-if="table">
          <ul class="messages" v-chat-scroll>
            <template v-for="message in messages">
              <v-card-text :key="message['.key']">
                <v-layout>
                  <template v-if="table">
                    <span class="teal--text">{{ firstName(message.author.name) }}</span>
                    <!-- <span v-else class="teal--text">(This is your room)</span> -->

                  </template>
                  <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
                </v-layout>
                <span class="grey--text time">{{ message.timestamp }}</span>
              </v-card-text>
            </template>
          </ul>
        </template>

        <v-divider></v-divider>

        <v-card-actions>
          <v-layout>
            <v-flex>
              <v-textarea
                name="input-7-1"
                label="Text area"
                v-model="newMessage"
                :hint="getHint()"
                class="mb-2"
              ></v-textarea>
              <template v-if="user">
                <!-- <v-btn v-if="user.uid === $route.params.id" block @click="submitQuestion()">Submit Question</v-btn> -->
                <v-btn @click="addMessage()" block>SEND MESSAGE</v-btn>
              </template>
              <div style="display: flex; justify-content: center;">
                <!-- <v-btn @click="clearMessages()">CLEAR MESSAGES</v-btn>
                <v-btn @click="clearMessages()">CLEAR MESSAGES</v-btn> -->
                <v-btn @click="askForHelp()" color="pink white--text">ASK FOR HELP</v-btn>
                <slot></slot>
              </div>
            </v-flex>
          </v-layout>
        </v-card-actions>
=======
      <div id="myModal" @click="modalDisplay='none'" :style="{display: modalDisplay}" class="modal">
        <img @click="(e)=>e.stopPropagation()" class="modal-content" :src="selectedDisplayImage">
      </div>
>>>>>>> ca712dcb100960ce228412d80de05327b948b9de

      <template v-if="table">
        <ul class="messages" v-chat-scroll>
          <template v-for="message in messages">
            <v-card-text :key="message['.key']">
              <v-layout>
                <template v-if="table">
                  <span class="teal--text">{{ firstName(message.author.name) }}</span>
                  <!-- <span v-else class="teal--text">(This is your room)</span> -->
                </template>
                <span class="grey--text text--darken--3 mx-1">{{ message.content }}</span>
                <img
                  v-if="message.fileURL"
                  :src="message.fileURL"
                  style="width:100%;max-width:100px;height:100%;max-height:100px"
                  @click="zoomDisplayImage(message.fileURL)"
                >
              </v-layout>
              <span class="grey--text time">{{ message.timestamp }}</span>
            </v-card-text>
          </template>
        </ul>
      </template>

      <v-divider></v-divider>

      <v-card-actions>
        <v-layout>
          <v-flex>
            <v-textarea
              name="input-7-1"
              label="Text area"
              v-model="newMessage"
              :hint="getHint()"
              class="mb-2"
            ></v-textarea>
            <template v-if="user">
              <!-- <v-btn v-if="user.uid === $route.params.id" block @click="submitQuestion()">Submit Question</v-btn> -->
              <v-btn @click="addMessage()" block>SEND MESSAGE</v-btn>
              <v-btn @click="selectImage()">SELECT IMAGE</v-btn>
              <input type="file" id="image-selector" style="display:none" @change="selectorChanged">
            </template>
            <div style="display: flex; justify-content: center;">
              <v-btn @click="clearMessages()">CLEAR MESSAGES</v-btn>
              <v-btn @click="askForHelp()">TOGGLE HELP</v-btn>
              <slot></slot>
            </div>
          </v-flex>
        </v-layout>
      </v-card-actions>
    </v-card>
  </div>
</template>


<script>
import moment from "moment";
import firebase from "firebase/app";
import db from "@/database.js";
import { mapState } from "vuex";

export default {
  props: ["ownerUid"],
  data() {
    return {
      newMessage: null,
      marker: true,
      messages: null,
      table: null,
      selectedImage: null,
      selectedDisplayImage: null,
      displayImage: false,
      modalDisplay: "none"
    };
  },
  computed: {
    ...mapState(["user"]),
    author() {
      return {
        name: this.user.name,
        uid: this.user.uid
      };
    }
  },
  created() {
    this.$root.$on("clear-chat", this.clearMessages);
    this.$root.$on("save-explanation", docId => this.saveMessages(docId));
  },
  watch: {
    ownerUid: {
      handler: "bindVariables",
      immediate: true
    }
  },
  methods: {
    askForHelp() {
      const ref = db.collection("workspaces").doc(this.ownerUid);
      console.log("this.table =", this.table);
      ref.update({
        isAskingQuestion: !this.table.isAskingQuestion
      });
    },
    getHint() {
      return "";
    },
    submitQuestion() {
      this.updateTableStatus(true);
      this.addMessage();
    },
    async updateTableStatus(isAskingQuestion) {
      const tableId = this.$route.params.id;
      console.log("tableId =", tableId);
      const tableRef = db.collection("tables").doc(tableId);
      await tableRef.update({
        isAskingQuestion
      });
      console.log("successfully updated table status");
    },

    saveMessages(explanationId) {
      const explanationRef = db
        .collection("explanations")
        .doc(explanationId)
        .collection("messages");
      this.messages.forEach(message => {
        explanationRef.doc(`${message[".key"]}`).set({
          author: message.author,
          content: message.content
        });
      });
    },
    bindVariables() {
      const ownerRef = db.collection("workspaces").doc(this.ownerUid);
      this.$binding("table", ownerRef);
      this.$binding("messages", ownerRef.collection("messages"));
    },
    firstName(fullName) {
      const names = fullName.split(" ");
      return names[0];
    },
    async addMessage() {
      if (!this.newMessage) {
        return;
      }
      let fileURL = null;
      if (this.selectedImage !== null) {
        fileURL = await this.uploadImage();
      }
      const content = this.newMessage;
      this.newMessage = null;
      const timestamp = moment(Date.now()).format("lll");
      const messagesRef = db
        .collection("workspaces")
        .doc(this.ownerUid)
        .collection("messages");

      await messagesRef.doc(`${this.messages.length + 1}`).set({
        content,
        author: this.author,
        timestamp,
        fileURL
      });
    },
    async clearMessages() {
      const messagesRef = db
        .collection("workspaces")
        .doc(this.ownerUid)
        .collection("messages");
      for (let i = 1; i < this.messages.length + 1; i++) {
        messagesRef.doc(`${i}`).delete();
      }
    },
    uploadImage() {
      const storageRef = firebase.storage().ref();
      const path = this.getRandomUID();
      const messagingFilesRef = storageRef.child(`messagingFiles/${path}`);
      let uploadTask = messagingFilesRef
        .put(this.selectedImage)
        .then(snapshot => snapshot.ref.getDownloadURL());
      return uploadTask;
    },
    getRandomUID() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return (
        s4() +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        "-" +
        s4() +
        s4() +
        s4()
      );
    },
    zoomDisplayImage(fileURL) {
      (this.selectedDisplayImage = fileURL), (this.modalDisplay = "block");
    },
    selectImage() {
      document.getElementById("image-selector").click();
    },
    selectorChanged(e) {
      console.log(e);
      this.selectedImage = e.target.files[0];
    }
  }
};
</script>

<style>
.chat-window {
  height: 80vh;
}

.time {
  display: block;
  font-size: 0.8em;
}

.messages {
<<<<<<< HEAD
	height: 50vh;
	overflow: auto;
=======
  height: 60vh;
  overflow: auto;
>>>>>>> ca712dcb100960ce228412d80de05327b948b9de
}
.messages::-webkit-scrollbar {
  width: 3px;
}
.messages::-webkit-scrollbar-track {
  background: #ddd;
}
.messages::-webkit-scrollbar-thumb {
  background: #aaa;
}

#myImg {
  border-radius: 5px;
  cursor: pointer;
  transition: 0.3s;
}

#myImg:hover {
  opacity: 0.7;
}

/* The Modal (background) */
.modal {
  display: none; /* Hidden by default */
  position: fixed; /* Stay in place */
  z-index: 1; /* Sit on top */
  padding-top: 100px; /* Location of the box */
  left: 0;
  top: 0;
  width: 100%; /* Full width */
  height: 100%; /* Full height */
  overflow: auto; /* Enable scroll if needed */
  background-color: rgb(0, 0, 0); /* Fallback color */
  background-color: rgba(0, 0, 0, 0.9); /* Black w/ opacity */
}

/* Modal Content (image) */
.modal-content {
  margin: auto;
  display: block;
  width: auto;
  max-width: 700px;
  height: auto;
  max-height: 700px;
}

/* Caption of Modal Image */
#caption {
  margin: auto;
  display: block;
  width: 80%;
  max-width: 700px;
  text-align: center;
  color: #ccc;
  padding: 10px 0;
  height: 150px;
}

/* Add Animation */
.modal-content,
#caption {
  -webkit-animation-name: zoom;
  -webkit-animation-duration: 0.6s;
  animation-name: zoom;
  animation-duration: 0.6s;
}

@-webkit-keyframes zoom {
  from {
    -webkit-transform: scale(0);
  }
  to {
    -webkit-transform: scale(1);
  }
}

@keyframes zoom {
  from {
    transform: scale(0);
  }
  to {
    transform: scale(1);
  }
}

/* The Close Button */
.close {
  position: absolute;
  top: 15px;
  right: 35px;
  color: #f1f1f1;
  font-size: 40px;
  font-weight: bold;
  transition: 0.3s;
}

.close:hover,
.close:focus {
  color: #bbb;
  text-decoration: none;
  cursor: pointer;
}

/* 100% Image Width on Smaller Screens */
@media only screen and (max-width: 700px) {
  .modal-content {
    width: 100%;
  }
}
</style>
