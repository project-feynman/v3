import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user 
    }
  },
  actions: {
    async signIn(context) {
      const provider = new firebase.auth.GoogleAuthProvider()
      const result = await firebase.auth().signInWithPopup(provider)
      context.commit('SET_USER', result.user)
    },
    async signOut(context) {
      await firebase.auth().signOut()
      context.commit('SET_USER', null)
    }
  }
})
