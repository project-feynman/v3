import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import BetaApp from "./BetaApp.vue"
import router from './router'
import store from './store'
// import './notifications'
import firebase from 'firebase/app'
import 'firebase/auth'
import VueFirestore from 'vue-firestore'
import VueChatScroll from 'vue-chat-scroll'
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'
import Clipboard from 'v-clipboard'
import vuetify from './plugins/vuetify'

// plugins 
Vue.use(VueChatScroll)
Vue.use(VueFirestore)
Vue.use(VuePlyr)
Vue.use(Clipboard)

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    store.dispatch('handleUserLogic', user)
  } else {
    // necessary for detecting when the user logs out
    store.commit('SET_USER', null)
  }
})

// new Vue({
//   router,
//   store,
//   vuetify,
//   render: h => h(App)
// }).$mount('#app')

new Vue({
  router,
  store,
  vuetify,
  render: h => h(BetaApp)
}).$mount('#app')
