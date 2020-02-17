import db from "@/database.js";
import firebase from "firebase/app";
import "firebase/storage";

export default {
  methods: {
    $_getDocRef (path) {
      return db.doc(path);
    },
    $_getCollectionRef (path) {
      return db.collection(path);
    },
    // that way every CRUD operation has explicit error handling without making the codebase verbose
    async $_dbMixin_getDoc (ref) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await ref.get();
          if (!doc.exists) {
            this.$root.$emit("show-snackbar", `Error: data doesn't exist for path = ${ref.path}`);
            reject();
          } else { resolve({ id: doc.id, ...doc.data() }); } 
        } catch (error) {
          this.$root.$emit("show-snackbar", error.message);
          reject("Error: cannot fetch doc");
        }
      });
    },
    async $_dbMixin_getDocs (ref) {
      return new Promise(async (resolve, reject) => {
        try {
          let results = [];
          const collectionSnapshot = await ref.get();
          collectionSnapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
          });
          resolve(results);
        } catch (error) {
          this.$root.$emit("show-snackbar", error.message);
          reject();
        }
      });
    },
    async $_dbMixin_listenToDoc (ref, obj, val) {
      return new Promise(async (resolve) => {
        try {
          const unsubscribeListener = ref.onSnapshot(doc => { // onSnapshot does NOT return a promise
            obj[val] = { ...doc.data(), "id": doc.id }
            resolve(unsubscribeListener);
          });
          // return unsubscribeListener;
        } catch (error) {
          this.$root.$emit("show-snackbar", error.message);
        } 
      });
    },
    async $_dbMixin_listenToDocs (ref, obj, val) {
      return new Promise(async (resolve) => {
        try {
          const unsubscribeListener = ref.onSnapshot(querySnapshot => { // onSnapshot does NOT return a promise
            let resultDocs = [];
            querySnapshot.forEach(doc => resultDocs.push({...doc.data(), "id": doc.id }));
            obj[val] = resultDocs;
            resolve(unsubscribeListener);
            // resolve(unsubscribeListener);
          });
          // return unsubscribeListener;
        } catch (error) {
          this.$root.$emit("show-snackbar", error.message);
        } 
      });
    },
    $_dbMixin_saveToStorage (path, blob) {
      return new Promise(async resolve => {
        try {
          const storageRef = firebase.storage().ref();
          const imageRef = storageRef.child(path);
          const uploadTask = imageRef.put(blob)
          uploadTask.on(firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => {},
            error => console.log('error =', error),
            async () => {
              const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
              resolve(downloadUrl);
            }
          );
        } catch (error) {
          this.$root.$emit("snow-snackbar", error.message);
          reject("Error: cannot save to storage");
        }
      });
    }
  }
};