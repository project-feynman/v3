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

<<<<<<< HEAD
var db = firebase.firestore()
var subscription = undefined

// register the service worker when the site loads
if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(
		function(serviceWorkerRegistration) {
			serviceWorkerRegistration.pushManager.subscribe().then(
				function(pushSubscription) {
					console.log('main')
					console.log(typeof(registration))
					console.log(JSON.stringify(registration))
					subscription = pushSubscription
					console.log(JSON.stringify(subscription))
					sendSubscriptionToFirebase()
				}, function(err){
					// handle error during subscription
					console.log("Error: push subscription failed.\t" + err)
				}
			)
		}
	)
}

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
