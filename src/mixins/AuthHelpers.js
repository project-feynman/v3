import firebase from "firebase/app";
import "firebase/auth";
import db from "@/database.js";

export default {
  data () {
    return {
      welcomeMessage: "Welcome to ExplainMIT!"
    };
  },
  methods: {
    /**
     * If the user logs in with Touchstone for the first time ever,
     * Firebase Auth needs to register it, and it will receive a UID. 
     * But we also store a mirror user document, and that UID must be the same. 
     * 
     * Subsequent log-ins will cause Firebase Auth to see that the user is already registered (through cookies or something),
     * and so firebase.onAuthStateChanged(user => ) the user's UID will be lookable from the Firestore. 
     */
    async $_logInWithTouchstone () {
      const provider = new firebase.auth.SAMLAuthProvider("saml.mit-touchstone"); 
      firebase.auth().signInWithPopup(provider)
        .then(async result => {
          this.$_createMirrorDocIfNeeded(result); 
          await this.$store.dispatch("listenToUserDoc", { uid: result.user.uid });
          this.$store.commit("SET_HAS_FETCHED_USER_INFO", true); 
          // redirect to most recent class
          const { class_id, section_id, room_id } = this.$route.params; 
          if (!(class_id && section_id && room_id)) {
            const { mostRecentClassID } = this.$store.state.user; 
            this.$router.replace(`/class/${mostRecentClassID}/section/${mostRecentClassID}/room/${mostRecentClassID}`);
          }
        })
        .catch(error => {
          console.log("error =", error);
        });
    },
    async $_signUp ({ "first name": firstName, "last name": lastName, email, password }) {
      if (!firstName || !lastName) { 
        this.$root.$emit(
          "show-snackbar", 
          "Error: don't forget to enter your first name and last name!"
        );
        return;
      }
      try {
        const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
        this.$_createAccount({ 
          firstName, 
          lastName,
          ...result.user
        });
        this.$root.$emit("show-snackbar", this.welcomeMessage);
      } catch (error) {
        this.$root.$emit("show-snackbar", error.message);
      }
    },
    async $_createMirrorDocIfNeeded (result) {
      try {
        return new Promise(async (resolve) => {  
          // translate variable names
          const userInfo = result.additionalUserInfo.profile; 
          const fullName = userInfo["urn:oid:2.16.840.1.113730.3.1.241"];
          const firstName = fullName.split(" ")[0];
          const lastName = fullName.split(" ")[1];
          const email = userInfo["urn:oid:1.3.6.1.4.1.5923.1.1.1.6"];
          const kind = userInfo["urn:oid:1.3.6.1.4.1.5923.1.1.1.1"];
          const year = userInfo["urn:oid:1.2.840.113554.1.4.1.1.15"];

          const queryResult = await db.collection("users").where("email", "==", email).get();
          console.log("queryResult =", queryResult);
          if (queryResult.empty) {
            await this.$_createAccount({
              firstName,
              lastName,
              email,
              uid: result.user.uid,
              kind // "student", "staff", "affiliate"
            });            
            this.$root.$emit("show-snackbar", "Successfully created account");
          } else {
            // queryResult.docs[0].id
            this.$root.$emit("show-snackbar", "Welcome back!");
          }
          resolve(); 
        });
      }
      catch (error) {
        console.log("error =", error);
      }
    },
    /**
     * Must include uid, email, firstName, lastName 
     * Optional attribute: `kind` 
     */
    $_createAccount ({ uid, email, firstName, lastName, kind }) {
      return new Promise(async resolve => {
        const exampleClassID = "lvzQqyZIV1wjwYnRV9hn"; 
        await db.collection("users").doc(uid).set({
          uid,
          email,
          firstName,
          lastName,
          kind: kind ? kind : null,
          enrolledClasses: [{ id: exampleClassID, name: "0.000", description: "For new users to explore" }],
          mostRecentClassID: exampleClassID
        });
        resolve();
      });
    },
    $_logIn ({ email, password }) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then(async result => {
          await this.$store.dispatch("listenToUserDoc", result.user); 
          this.$store.commit("SET_HAS_FETCHED_USER_INFO", true);
          this.$root.$emit("show-snackbar", "Welcome back!"); 
          // redirect to most recent class
          const { class_id, section_id, room_id } = this.$route.params; 
          if (!(class_id && section_id && room_id)) {
            const { mostRecentClassID } = this.$store.state.user; 
            this.$router.replace(`/class/${mostRecentClassID}/section/${mostRecentClassID}/room/${mostRecentClassID}`);
          }
        })
        .catch(error => {
          this.$root.$emit("show-snackbar", error.message);
        });
    },
    $_signOut () { 
      firebase.auth().signOut(); 
      document.location.reload(); 
    }
  }
}