import Vue from 'vue';
import Vuex from 'vuex';
import firebase from 'firebase/app';
import 'firebase/firestore';
import 'firebase/database';
import db from '@/database.js';

Vue.use(Vuex)

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
    await firebaseRef.onDisconnect().set(isOffline) // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
    firebaseRef.set(isOnline)
    // updating firestore directly is much faster
    firebase.firestore().collection('users').doc(user.uid).update({
      isOnline: true
    });
  });
}

function getRandomColor () {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (let i=0; i<6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

function syncUserWithDB (userRef, context) {
  userRef.onSnapshot(user => {
    context.commit('SET_USER', user.data())
    // TODO: delete previous onDisconnect() hook 
    setDisconnectHook(user.data())
  });
}

export default new Vuex.Store({
  state: {
    user: null,
    isFetchingUser: true
  },
  mutations: {
    SET_USER (state, user) {
      state.user = user 
      state.isFetchingUser = false 
    }
  },
  actions: {
    // Fetches the user document, binds it to a variable accessible by all components and listens for any changes
    async handleUserLogic (context, { uid, email }) {
      if (!uid) { return; }
      const simplifiedUser = { uid, email }
      // Commit the user to avoid blocking page load first 
      context.commit('SET_USER', simplifiedUser) 
      
      // Fetch additional data from the mirror doc 
      const userRef = db.collection('users').doc(uid)
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) { syncUserWithDB(userRef, context); } 
      else {
        // Create a new account
        simplifiedUser.color = getRandomColor()
        simplifiedUser.enrolledClasses = [] 
        userRef.set(simplifiedUser)
        syncUserWithDB(userRef, context);
      }
    }
  }
})
