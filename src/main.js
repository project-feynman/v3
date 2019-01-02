import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import firebase from 'firebase/app'
import 'firebase/auth'
import VueFirestore from 'vue-firestore'
import VueChatScroll from 'vue-chat-scroll'

Vue.use(VueChatScroll)
Vue.use(VueFirestore)

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    store.dispatch('handleUserLogic', user)
  } else {
    store.commit('SET_USER', null)
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
