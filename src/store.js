import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/database'
import db from '@/database.js'

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

function getRandomColor() {
  var letters = '0123456789ABCDEF'
  var color = '#'
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
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
    async handleUserLogic (context, { uid, email }) {
      let simplifiedUser = { uid, email }
      if (!uid) {
        return
      }
      context.commit('SET_USER', simplifiedUser) // commit the user to avoid blocking page load 
      // update its "isOnline" property later
      const userRef = db.collection('users').doc(uid)
      const mirrorUser = await userRef.get() 
      // HOW TO REFACTOR: 
      // 1) Basically, just set up the onSnapshot() 
      // 2) Figure out if you have to create a new user 
      // by checking if "state.user" is still null 
      // after retrieving the initial snapshot 
      // 3) Step 2 might not work
      if (mirrorUser.exists) {
        // now set up syncing with the user copy
        userRef.onSnapshot(user => {
          context.commit('SET_USER', user.data())
          // TODO: delete previous onDisconnect() hook 
          setDisconnectHook(user.data())
        }) 
      } else {
        // create a new account
        simplifiedUser.color = getRandomColor()
        userRef.set(simplifiedUser)
        // now set up syncing with the user copy
        userRef.onSnapshot(user => {
          context.commit('SET_USER', user.data())
          // TODO: delete previous onDisconnect() hook 
          setDisconnectHook(user.data())
        }) 
      }
    }
  }
})
