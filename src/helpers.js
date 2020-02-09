export default {
  // Given a Firestore ref, returns a single document
  async getDocFromDb (ref) {
    const promise = new Promise(async (resolve, reject) => {
      let doc = await ref.get();
      if (doc.exists) resolve({"id": doc.id, ...doc.data()});
      else reject();
    })
    return promise;
  },
  async getCollectionFromDB (ref) {
    const promise = new Promise(async resolve => {
      const results = [];
      const collectionSnapshot = await ref.get();
      collectionSnapshot.forEach(doc => {
        // TODO: change .key to id
        results.push({ ".key": doc.id, ...doc.data() });
      });
      resolve(results);
    });
    return promise;
  }
};
