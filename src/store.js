import Vue from 'vue'
import Vuex from 'vuex'
import db from '@/database.js'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'

Vue.use(Vuex)

function setDisconnectHook(user) {
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
    if (snapshot.val() == false) { 
      // do nothing 
    } else {
      await firebaseRef.onDisconnect().set(isOffline) // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
      firebaseRef.set(isOnline)
      // updating firestore directly is much faster
      firebase.firestore().collection('users').doc(user.uid).update({
        isOnline: true
      })
    }
  })
}

export default new Vuex.Store({
  state: {
    user: null,
    isFetchingUser: true
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user 
      state.isFetchingUser = false 
    }
  },
  actions: {
    async handleUserLogic(context, { uid, email }) {
      let simplifiedUser = { uid, email }
      context.commit('SET_USER', simplifiedUser) // commit the user to avoid blocking page load 
      // update its "isOnline" statement later
      const userRef = db.collection('users').doc(uid) 
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) {
        // now set up syncing with the user copy
        userRef.onSnapshot(user => {
          context.commit('SET_USER', user.data())
          // delete previous onDisconnect() hook 
          setDisconnectHook({ uid })
        }) 
      } else {
        // create a new account
        userRef.set(simplifiedUser)
        // now set up syncing with the user copy
        userRef.onSnapshot(user => {
          context.commit('SET_USER', user.data())
          // delete previous onDisconnect() hook 
          setDisconnectHook({ uid })
        }) 
      }
    }
  }
})
