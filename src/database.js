import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/analytics";

firebase.initializeApp({
  apiKey: "AIzaSyB7XsbhYEd_4DQigc_hfnmdpcwlvzugPOw",
  authDomain: "feynman-mvp.firebaseapp.com",
  databaseURL: "https://feynman-mvp.firebaseio.com",
  projectId: "feynman-mvp",
  storageBucket: "feynman-mvp.appspot.com",
  messagingSenderId: "148720897081",
  appId: "1:148720897081:web:fdf5c605dcc74b56",
  measurementId: "G-DR4M7QGV7Z"
});

firebase.analytics();
firebase.analytics().logEvent("Opened website");

export default firebase.firestore();

// TO PREVENT CORS ISSUES, RUN:
// gsutil cors set cors.json gs://feynman-mvp.appspot.com
