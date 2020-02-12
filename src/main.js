import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import firebase from 'firebase/app'
import 'firebase/auth'
import VueFirestore from 'vue-firestore'
import VuePlyr from 'vue-plyr'
import 'vue-plyr/dist/vue-plyr.css'
import vuetify from './plugins/vuetify'

// Plugins 
Vue.use(VueFirestore)
Vue.use(VuePlyr)

Vue.config.productionTip = false

firebase.auth().onAuthStateChanged(user => {
  if (user) store.dispatch("fetchUser", user);
  else store.commit('SET_USER', null); // necessary for detecting when the user logs out 
})

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
