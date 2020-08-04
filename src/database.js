import firebase from "firebase/app";
import "firebase/firestore";

firebase.initializeApp({
  apiKey: "AIzaSyB7XsbhYEd_4DQigc_hfnmdpcwlvzugPOw",
  authDomain: "feynman-mvp.firebaseapp.com",
  databaseURL: "https://feynman-mvp.firebaseio.com",
  projectId: "feynman-mvp",
  storageBucket: "feynman-mvp.appspot.com",
  messagingSenderId: "148720897081"
});

export default firebase.firestore();

// TO PREVENT CORS ISSUES, RUN:
// gsutil cors set cors.json gs://feynman-mvp.appspot.com
