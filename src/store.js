import Vue from 'vue'
import Vuex from 'vuex'
import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
import db from '@/database.js'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    user: null,
    isFetchingUser: true,
    creatingTeacher: false
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user 
      // quick-fix
      state.isFetchingUser = false 
    },
    SET_CREATING_TEACHER(state, boolean) {
      state.creatingTeacher = boolean 
    }
  },
  actions: {
    async handleUserLogic(context, user) {
      let simplifiedUser = {
        name: user.displayName,
        uid: user.uid 
      }
      context.commit('SET_USER', simplifiedUser) // commit the user to avoid blocking page load 
      const userRef = db.collection('users').doc(user.uid) 
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) {
        context.commit('SET_USER', mirrorUser.data())
        console.log('user document fetched')
      } else {
        if (context.state.creatingTeacher) {
          simplifiedUser.isTeacher = true 
        }
        userRef.set(simplifiedUser)
        context.commit('SET_USER', simplifiedUser)
        console.log('user document fetched')
      }
    }
  }
})
