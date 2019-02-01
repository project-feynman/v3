import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './notifications'
import firebase from 'firebase/app'
import 'firebase/auth'
import VueFirestore from 'vue-firestore'
import VueChatScroll from 'vue-chat-scroll'

// plugins 
Vue.use(VueChatScroll)
Vue.use(VueFirestore)

Vue.config.productionTip = false

var db = firebase.firestore()
var subscription = undefined

// Register a global custom directive called `v-focus`
Vue.directive('focus', {
  // when the bound element is inserted into the DOM
  inserted: function (el) {
    el.focus()
  },
  update: function (el) {
    el.focus()
  }
})

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    store.dispatch('handleUserLogic', user)
  } else {
    // necessary for detecting when the user logs out
    store.commit('SET_USER', null)
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
