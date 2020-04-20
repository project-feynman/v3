import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';
import db from '@/database.js';

Vue.use(Vuex);

function setDisconnectHook (user) {
	const firebaseRef = firebase.database().ref('/status/' + user.uid);
	firebase.database().ref('.info/connected').on('value', async (snapshot) => {
    if (snapshot.val() === false) return; // copied from Firebase, no idea why it's needed  
    await firebaseRef.onDisconnect().set({ isOnline: false }); // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
    firebaseRef.set({ 
      isOnline: true 
    });
    firebase.firestore().collection('users').doc(user.uid).update({
      isOnline: true // updating firestore directly is much faster, don't wait for mirroring
    });
  });
}

function syncUserWithDb (userRef, context) {
  userRef.onSnapshot((user) => {
    if (!user.exists) return; 
    context.commit('SET_USER', user.data());
    // TODO: delete previous onDisconnect() hook 
    setDisconnectHook(user.data());
  });
}

async function getDocFromDb (ref) {
  const promise = new Promise(async (resolve, reject) => {
    const doc = await ref.get();
    if (doc.exists) {
      resolve({ 
        id: doc.id, 
        ...doc.data() 
      });
    } 
    else reject(); 
  });
  return promise;
}

export default new Vuex.Store({
  state: {
    user: null,
    isFetchingUser: true,
    mitClass: null
  },
  mutations: {
    SET_USER (state, user) {
      state.user = user 
      state.isFetchingUser = false 
    },
    SET_CLASS (state, mitClass) {
      state.mitClass = mitClass;
    }
  },
  actions: {
    fetchClass (context, classId) {
      return new Promise(async (resolve) => {
        const ref = db.collection("classes").doc(classId);
        const classDoc = await getDocFromDb(ref);
        context.commit("SET_CLASS", classDoc);
        resolve();
      });
    },
    // Fetches the user document, binds it to a variable accessible by all components and listens for any changes
    async fetchUser (context, { uid, email }) {
      if (!uid) return;
      context.commit('SET_USER', { uid, email }); // commit the user as soon as basic info has been fetched to avoid blocking page load
      const mirrorUserRef = db.collection('users').doc(uid);
      syncUserWithDb(mirrorUserRef, context);
    }
  }
})
