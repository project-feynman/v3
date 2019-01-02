import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import db from '@/database.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    SET_USER(state, user) {
      console.log('SET_USER called')
      state.user = user 
    }
  },
  actions: {
    async handleUserLogic(context, user) {
      context.commit('SET_USER', user) // commit the user to avoid blocking page load 
      const userRef = db.collection('users').doc(user.uid) 
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) {
        console.log('returning user')
      } else {
        console.log('a new user and table are being created!')
        const simplifiedUser = {
          name: user.displayName,
          uid: user.uid 
        }
        userRef.set(simplifiedUser)
        const tableRef = db.collection('tables').doc(user.uid)
        tableRef.set({
          owner: simplifiedUser
        })
      }
    }
  }
})
