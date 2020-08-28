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
    async $_logInWithTouchstone () {
      const provider = new firebase.auth.SAMLAuthProvider("saml.mit-touchstone"); 
      firebase.auth().signInWithPopup(provider)
        .then((result) => {
          console.log("result =", result);
          // User is signed in.
          // Identity provider data available in result.additionalUserInfo.profile,
          // or from the user's ID token obtained from result.user.getIdToken()
          // as an object in the firebase.sign_in_attributes custom claim
          // This is also available from result.user.getIdTokenResult()
          // idTokenResult.claims.firebase.sign_in_attributes.
        })
        .catch((error) => {
          console.log("error =", error);
          // Handle error.
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
    $_createAccount ({ uid, email, firstName, lastName }) {
      function getRandomColor () {
        const letters = "0123456789ABCDEF";
        let color = "#";
        for (let i = 0; i < 6; i++) {
          color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
      }
      const color = getRandomColor();
      const enrolledClasses = [];
      db.collection("users").doc(uid).set({ 
        uid, 
        email, 
        firstName, 
        lastName, 
        color, 
        enrolledClasses 
      });
    },
    $_logIn ({ email, password }) {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((user) => {
          this.$store.dispatch("fetchUser", user);
          this.$root.$emit("show-snackbar", this.welcomeMessage);
        })
        .catch((error) => this.$root.$emit("show-snackbar", error.message));
    },
    $_signOut () { 
      firebase.auth().signOut(); 
    }
  }
}