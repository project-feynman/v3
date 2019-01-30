import firebase from 'firebase/app'
import 'firebase/firestore'
import 'firebase/auth'


function sendSubscriptionToFirebase() {
	var user = firebase.auth().currentUser
	console.log('here')
	if(user) {
		var uid = user.uid
		console.log('uid == ' + uid + ": " + uid == "tdUR6vn0LdOuqGKzrA3EmsVpXOv1")
		var col = firebase.colection('users/' + uid + '/subscriptions/')
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
			var uid = user.uid
			var col = firebase.colection('users/' + uid + '/subscriptions/')
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
		})
	}
}
