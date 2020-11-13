import Vue from 'vue';
import Vuex from 'vuex';
import db from '@/database.js';
import { getRandomId } from '@/helpers.js';
import { SUPER_USER_EMAILS, BlackboardTools } from "@/CONSTANTS.js";

Vue.use(Vuex);

function setDisconnectHook (user) {
	// const firebaseRef = firebase.database().ref('/status/' + user.uid);
	// firebase.database().ref('.info/connected').on('value', async snapshot => {
  //   if (snapshot.val() === false) return; // copied from Firebase, no idea why it's needed  
  //   await firebaseRef.onDisconnect().set({ isOnline: false }); // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
  //   firebaseRef.set({ isOnline: true });
  //   firebase.firestore().collection('users').doc(user.uid).update({
  //     isOnline: true // updating firestore directly is much faster, don't wait for mirroring
  //   });
  // });
}

// function syncMitClassWithDb (mitClassRef, context) {
//   mitClassRef.onSnapshot(mitClass => {
//     if (!mitClass.exists) return; 
//     console.log(mitClass.data())
//     context.commit('SET_CLASS', mitClass.data());
//     setDisconnectHook(mitClass.data()); // TODO: delete previous onDisconnect() hook 
//   });
// }

async function getDocFromDb (ref) {
  return new Promise(async (resolve, reject) => {
    const doc = await ref.get();
    if (doc.exists) { 
      resolve({ id: doc.id, ...doc.data() });
    } else { 
      reject(); 
    }
  });
}

export default new Vuex.Store({
  state: {
    user: null,
    hasFetchedUserInfo: false,
    isFetchingUser: true,
    mitClass: null,
    explCache: {},
    blackboardRoom: null,
    session: {},
    canHearAudio: false,
    isMicOn: false,
    isCameraOn: false,
    isConnectedToAudio: false,
    dominantSpeaker: {
      id: "",
      name: ""
    },
    roomIDtoParticipants: null,

    // blackboard related states
    isBoardFullscreen: false,
    currentTool: { 
      type: BlackboardTools.PEN,
      color: "cyan",
      lineWidth: 2
    },
    onlyAllowApplePencil: true
  },
  getters: {
    isAdmin: state => {
      return SUPER_USER_EMAILS.includes(state.user.email) || ["staff", "affiliate"].includes(state.user.kind); 
    }
  },
  mutations: {
    // so the user's pen color persists across different boards
    SET_CURRENT_TOOL (state, newVal) {
      state.currentTool = newVal; 
    },
    SET_ONLY_ALLOW_APPLE_PENCIL (state, newVal) {
      state.onlyAllowApplePencil = newVal; 
    },
    SET_DOMINANT_SPEAKER_NAME (state, newVal) {
      state.dominantSpeaker.name = newVal; 
    },
    SET_IS_BOARD_FULLSCREEN (state, newVal) {
      state.isBoardFullscreen = newVal; 
    },
    SET_CAN_HEAR_AUDIO (state, newVal) {
      state.canHearAudio = newVal; 
    },
    SET_IS_MIC_ON (state, newVal) {
      state.isMicOn = newVal; 
    },
    SET_IS_CAMERA_ON (state, newVal) {
      state.isCameraOn = newVal;
    },
    SET_HAS_FETCHED_USER_INFO (state, newVal) {
      state.hasFetchedUserInfo = newVal; 
    },
    SET_USER (state, user) {
      state.user = user;
      state.isFetchingUser = false;
    },
    SET_CLASS (state, mitClass) {
      state.mitClass = mitClass;
    },
    SET_ROOM (state, blackboardRoom) {
      state.blackboardRoom = blackboardRoom; 
    },
    SET_SESSION (state, session) {
      state.session = session;
    },
    SET_ROOM_ID_TO_PARTICIPANTS (state, roomIDtoParticipants) {
      state.roomIDtoParticipants = roomIDtoParticipants;
    },
    /**
     * Saves an explanation to the global cache so it can be accessed and uploaded to Firestore in the app background
     *
     * @param {*} state contains data that is stored globally across the application 
     * @param {*} expl contains optional properties: strokesArray, audio, backgroundImageBlob
     *                 and a nested object `metadata` which contains title, html, duration, creator, mitClass, etc. 
     */
    ADD_EXPL_TO_CACHE (state, expl) {
      state.explCache[expl.ref.id] = expl;
    },
    SET_DOMINANT_SPEAKER_UID (state, dominantSpeakerUID) {
      state.dominantSpeakerUID = dominantSpeakerUID; 
    }
  },
  actions: {
    fetchClass (context, classId) {
      return new Promise(async resolve => {
        const ref = db.collection("classes").doc(classId);
        const classDoc = await getDocFromDb(ref);
        context.commit("SET_CLASS", classDoc);
        // syncMitClassWithDb(ref, context);
        resolve();
      });
    },
    // Fetches the user document, binds it to a variable accessible by all components and listens for any changes
    // TODO: rename to listenToFirestoreUser
    async fetchUser (context, { uid, refreshToken }) {
      return new Promise((resolve, reject) => {
        const sessionObject = {
          currentID: getRandomId()
        };
        if (refreshToken) {
          sessionObject.refreshToken = refreshToken.substring(refreshToken.length - 20) 
        }
        context.commit('SET_SESSION', sessionObject);

        const mirrorUserRef = db.collection("users").doc(uid);
        mirrorUserRef.onSnapshot(userDoc => {
          if (!userDoc.exists) {
            reject("Can't find user's Firestore doc with given UID");
            context.commit("SET_USER", null);
          } else {
            context.commit("SET_USER", userDoc.data());
            resolve();
          }
        });
      });
    }
  }
})
