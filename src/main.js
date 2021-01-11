import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import PortalVue from 'portal-vue';

Vue.config.productionTip = false;

new Vue({ 
  router, 
  store, 
  vuetify, 
  render: h => h(App) 
}).$mount('#app');

Vue.use(PortalVue);

