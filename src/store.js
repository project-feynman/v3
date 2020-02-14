import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';
import db from '@/database.js';
import helpers from "@/helpers.js";

Vue.use(Vuex);

function setDisconnectHook (user) {
	const firebaseRef = firebase.database().ref('/status/' + user.uid)
	let isOffline = {
		isOnline: false,
		// last_changed: firebase.database.ServerValue.TIMESTAMP
	}
	let isOnline = {
		isOnline: true,
		// last_changed: firebase.database.ServerValue.TIMESTAMP
	}

	firebase.database().ref('.info/connected').on('value', async snapshot => {
    if (snapshot.val() === false) { return; } // copied from Firebase, no idea why it's needed  
    await firebaseRef.onDisconnect().set(isOffline); // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
    firebaseRef.set(isOnline);
    // Updating firestore directly is much faster, don't wait for mirroring
    firebase.firestore().collection('users').doc(user.uid).update({
      isOnline: true
    });
  });
}

function syncUserWithDb (userRef, context) {
  userRef.onSnapshot(user => {
    if (!user.exists) { return; }
    context.commit('SET_USER', user.data());
    // TODO: delete previous onDisconnect() hook 
    setDisconnectHook(user.data());
  });
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
    async fetchClass (context, classId) {
      const ref = db.collection("classes").doc(classId);
      const classDoc = await helpers.getDocFromDb(ref);
      context.commit("SET_CLASS", classDoc);
    },
    // Fetches the user document, binds it to a variable accessible by all components and listens for any changes
    async fetchUser (context, { uid, email }) {
      if (!uid) { return; }
      context.commit('SET_USER', { uid, email }); // commit the user as soon as basic info has been fetched to avoid blocking page load
      const mirrorUserRef = db.collection('users').doc(uid);
      syncUserWithDb(mirrorUserRef, context);
    }
  }
})
