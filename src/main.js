import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import firebase from 'firebase/app';
import 'firebase/auth';
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged(user => {
  if (user) { 
    store.dispatch("fetchUser", user); 
  } else { 
    store.commit('SET_USER', null); // necessary for detecting when the user logs out 
  } 
})

new Vue({ 
  router, 
  store, 
  vuetify, 
  render: h => h(App) }
).$mount('#app');
