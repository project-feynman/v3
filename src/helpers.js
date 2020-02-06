export default {
  // Given a Firestore ref, returns a single document
  async getDocFromDB (ref) {
    const data = await ref.get();
  },
  async getCollectionFromDB (ref) {
    const promise = new Promise(async (resolve) => {
      const results = [];
      const collectionSnapshot = await ref.get();
      collectionSnapshot.forEach(doc => {
        results.push({ ".key": doc.id, ...doc.data() });
      });
      resolve(results);
    });
    return promise;
  }
};
