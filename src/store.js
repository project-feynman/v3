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
		last_changed: firebase.firestore.FieldValue.serverTimestamp()
	}
	let isOnline = {
		isOnline: true,
		last_changed: firebase.firestore.FieldValue.serverTimestamp()
	}

	firebase.database().ref('.info/connected').on('value', async snapshot => {
    console.log('snapshot.val() =', snapshot.val())
    if (snapshot.val() == false) { return } 
    console.log('setting the onDisconnect() hook...')
    await firebaseRef.onDisconnect().set(isOffline) // server now knows if connection is lost, perform "set(isOfflineForDatabase)"
    // this is a lie
    firebaseRef.set(isOnline)
    // redundant, but MUCH faster
    firebase.firestore().collection('users').doc(user.uid).update({
      isOnline: true
    })
  })
}

function syncFirestoreToVuex(ref) {
  ref.onSnapshot(user => {
    context.commit('SET_USER', user.data())
    setDisconnectHook(user)
  }) 
}

// ref.onSnapshot(mirror => {
//   context.commit('setUser', mirror.data())
//   if (!context.state.handledOnlineStatus) {
//     checkOnlineStatusAndSetDisconnectHook(mirror.data())
//     context.commit('setHandledOnlineStatus', true)
//   }
// })

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
            setDisconnectHook({ uid })
          }) 
      } else {
        // create a new account
        userRef.set(simplifiedUser)
        // now set up syncing with the user copy
        userRef.onSnapshot(user => {
          context.commit('SET_USER', user.data())
          setDisconnectHook({ uid })
        }) 
      }
    }
  }
})
