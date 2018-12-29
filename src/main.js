import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import firebase from 'firebase/app'
import 'firebase/auth'

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    store.commit('SET_USER', user)
  }
})

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
