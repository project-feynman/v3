import firebase from 'firebase/app'
import 'firebase/firestore'
 
const config = {
  apiKey: "AIzaSyB7XsbhYEd_4DQigc_hfnmdpcwlvzugPOw",
  authDomain: "feynman-mvp.firebaseapp.com",
  databaseURL: "https://feynman-mvp.firebaseio.com",
  projectId: "feynman-mvp",
  storageBucket: "feynman-mvp.appspot.com",
  messagingSenderId: "148720897081"
}

const firebaseApp = firebase.initializeApp(config)
firebaseApp.firestore().settings({ timestampsInSnapshots: true })

export default firebaseApp.firestore()