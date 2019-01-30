import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './notifications'
import './registerServiceWorker'
import firebase from 'firebase/app'
import 'firebase/auth'
import VueFirestore from 'vue-firestore'
import VueChatScroll from 'vue-chat-scroll'

Vue.use(VueChatScroll)
Vue.use(VueFirestore)

Vue.config.productionTip = false

var db = firebase.firestore()
var subscription = undefined

// register the service worker when the site loads
firebase.auth().onAuthStateChanged(async user => {
  if (user) {
    await store.dispatch('handleUserLogic', user)
    router.push('/explanation/HLN17RpYYzqfVHqYsSK1')
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
