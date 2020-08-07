import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';
import db from '@/database.js';

Vue.use(Vuex);

function setDisconnectHook (user) {
	const firebaseRef = firebase.database().ref('/status/' + user.uid);
	firebase.database().ref('.info/connected').on('value', async snapshot => {
    if (snapshot.val() === false) return; // copied from Firebase, no idea why it's needed  
    await firebaseRef.onDisconnect().set({ isOnline: false }); // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
    firebaseRef.set({ isOnline: true });
    firebase.firestore().collection('users').doc(user.uid).update({
      isOnline: true // updating firestore directly is much faster, don't wait for mirroring
    });
  });
}

function syncUserWithDb (userRef, context) {
  userRef.onSnapshot(user => {
    if (!user.exists) return; 
    context.commit('SET_USER', user.data());
    setDisconnectHook(user.data()); // TODO: delete previous onDisconnect() hook 
  });
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
    if (doc.exists) resolve({ id: doc.id, ...doc.data() });
    else reject(); 
  });
}

export default new Vuex.Store({
  state: {
    user: null,
    isFetchingUser: true,
    mitClass: null,
    explCache: {},
    blackboardRoom: null,
    rToken: ""
  },
  mutations: {
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
    SET_RTOKEN (state, refreshToken){
      state.rToken = refreshToken;
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
    }
  },
  actions: {
    fetchClass (context, classId) {
      return new Promise(async resolve => {
        const ref = db.collection("classes").doc(classId);
        const classDoc = await getDocFromDb(ref);
        // console.log(classDoc);
        context.commit("SET_CLASS", classDoc);
        // syncMitClassWithDb(ref, context);
        resolve();
      });
    },
    // Fetches the user document, binds it to a variable accessible by all components and listens for any changes
    async fetchUser (context, { uid, email, refreshToken }) {
      if (!uid) return;
      console.log(refreshToken, "SUB", refreshToken.substring(refreshToken.length-20))
      context.commit('SET_RTOKEN', refreshToken.substring(refreshToken.length-20));
      context.commit('SET_USER', { uid, email }); // commit the user as soon as basic info has been fetched to avoid blocking page load
      const mirrorUserRef = db.collection('users').doc(uid);
      syncUserWithDb(mirrorUserRef, context);
    }
  }
})
