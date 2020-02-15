export default {
  methods: {
    async $_dbMixin_getDoc (ref) {
      return new Promise(async (resolve, reject) => {
        try {
          const doc = await ref.get();
          if (!doc.exists) {
            this.$root.$emit("show-snackbar", "Error: data doesn't exist");
            reject();
          } else { resolve({ id: doc.id, ...doc.data() }); } 
        } catch (error) {
          this.$root.$emit("show-snackbar", error.message);
          reject();
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
    }
  }
};