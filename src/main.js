import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import firebase from 'firebase/app';
import 'firebase/auth';
import vuetify from './plugins/vuetify';
import PortalVue from 'portal-vue';

Vue.config.productionTip = false;

firebase.auth().onAuthStateChanged(user => {
  if (user) {
    store.dispatch("fetchUser", { uid: user.uid }); 
  } else { 
    // user logged out
    store.commit('SET_USER', null);
  }
})

new Vue({ 
  router, 
  store, 
  vuetify, 
  render: h => h(App) 
}).$mount('#app');

Vue.use(PortalVue)
