import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'
// import db from '@/database.js'

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(serviceWorkerRegistration => {
		const pk = "BNEwazYWUSz564A2glevVL7D4qYwaeWuj73Ux8lwYtb-biwlPqYyoc5B4QY_YyZxeR_GSMX4zqmK50yphVFS3_Y"
		serviceWorkerRegistration.pushManager.subscribe(
		{
			userVisibleOnly: true,
			applicationServerKey: urlB64ToUint8Array(pk)
		}).then(
			function(pushSubscription) {
				sendSubscriptionToFirestore(pushSubscription) 
			}, function(err){
				// try to unsubscribe and subscribe again on error
				serviceWorkerRegistration.pushManager.getSubscription(obsoleteSub => {
					obsoleteSub.unsubscribe()
					serviceWorkerRegistration.pushManager.subscribe(
					{
						userVisibleOnly: true,
						applicationServerKey: urlB64ToUint8Array(pk)
					}).then(function(pushSubscription) {
						sendSubscriptionToFirestore(pushSubscription) 
					}, function(err){
						console.log("Error: push subscription failed.\t" + err)
					}
				)
			})
		})
	})
}

function sendSubscriptionToFirestore(subscription) {
	  firebase.auth().onAuthStateChanged(async user => {
      const db = firebase.firestore()
		  const uid = user.uid
		  const col = db.collection('/users/' + uid + '/subscriptions/')
		  const query = col.where('subscription','==', JSON.stringify(subscription))

      const snapshot = await query.get()
      if (snapshot.docs.length == 0) {
        col.add({
          subscription: JSON.stringify(subscription),
          timestamp: Math.floor(Date.now() / 1000)
        })
      }
  })
}
// helper function for dealing with VAPID key
function urlB64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
