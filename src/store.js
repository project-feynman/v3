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
      context.commit('SET_USER', user) // commit the user to avoid blocking page load 
      const userRef = db.collection('users').doc(user.uid) 
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) {
        console.log('returning user')
        context.commit('SET_USER', mirrorUser.data())
      } else {
        console.log('a new user is being created!')
        const simplifiedUser = {
          name: user.displayName,
          uid: user.uid 
        }
        if (context.state.creatingTeacher) {
          console.log('and it is a teacher!')
          simplifiedUser.isTeacher = true 
          // fuck the subject number for now
        }
        userRef.set(simplifiedUser)
      }
    }
  }
})
