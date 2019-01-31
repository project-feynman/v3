import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('/sw.js').then(serviceWorkerRegistration => {
		const pk = "BNEwazYWUSz564A2glevVL7D4qYwaeWuj73Ux8lwYtb-biwlPqYyoc5B4QY_YyZxeR_GSMX4zqmK50yphVFS3_Y"
		serviceWorkerRegistration.pushManager.subscribe(
		{
			userVisibleOnly: true,
			applicationServerKey: urlB64ToUint8Array(pk)
		}).then(
			function(_) { }, function(err){
				// handle error during subscription
				console.log("Error: push subscription failed.\t" + err)
			}
		)
	})
}

navigator.serviceWorker.ready.then(serviceWorkerRegistration => {
	serviceWorkerRegistration.pushManager.getSubscription().then(subscription => {
		console.log('here')
		const db = firebase.firestore()
		var user = firebase.auth().currentUser
		if(user) {
			var uid = user.uid
			var col = db.collection('users/' + uid + '/subscriptions/')
			var query = col.where("subscription","==", JSON.stringify(subscription))
			query.get().then(function(snapshot) {
				if(snapshot.docs) {
					return
				} else {
					col.add({
						subscription: JSON.stringify(subscription),
						timestamp: Math.floor(Date.now() / 1000)
					})
				}
			})
		} else {
			firebase.auth().onAuthStateChanged(function(user) {
				console.log('at least i got here')
				var uid = user.uid
				var col = db.collection('/users/' + uid + '/subscriptions/')
				var query = col.where("subscription","==", JSON.stringify(subscription))

				query.get().then(function(snapshot) {
					if(snapshot.docs.length != 0) {
						console.log(snapshot.docs)
						return
					} else {
						col.add({
							subscription: JSON.stringify(subscription),
							timestamp: Math.floor(Date.now() / 1000)
						})
					}
				})
			})
		}
	})
})
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
