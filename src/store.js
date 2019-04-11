import Vue from 'vue'
import Vuex from 'vuex'
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
    async handleUserLogic(context, { nickname, uid, email }) {
      // console.log('handleUserLogic()')
      // console.log('nickname =', nickname)
      let simplifiedUser = {
        uid,
        email,
        nickname: "Anonymous"
      }
      if (nickname) {
        simplifiedUser.nickname = nickname 
      }
      context.commit('SET_USER', simplifiedUser) // commit the user to avoid blocking page load 
      const userRef = db.collection('users').doc(uid) 
      const mirrorUser = await userRef.get() 
      if (mirrorUser.exists) {
        context.commit('SET_USER', mirrorUser.data())
      } else {
        userRef.set(simplifiedUser)
        console.log('simplifiedUser =', simplifiedUser)
        context.commit('SET_USER', simplifiedUser)
        console.log('successfully created mirror user')
        // console.log('user document fetched')
      }
    }
  }
})
