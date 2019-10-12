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

const firestore = firebaseApp.firestore()
const settings = {/* your settings... */ timestampsInSnapshots: true};
firestore.settings(settings);

export default firestore

// TO PREVENT CORS ISSUES, RUN:
// gsutil cors set cors.json gs://feynman-mvp.appspot.com
