/*
  Contains data migrations scripts (best to just copy and paste into a page component, reload localhost once, and then remove it)
*/

// async created () {
//   const query = db.collection(`classes/${this.$route.params.class_id}/posts`).where("tags", "array-contains", "Discussion Section (April 4))");
//   const posts = await this.$_getCollection(query);
//   for (const post of posts) {
//     console.log("post =", post);
//     await db.collection(`classes/${this.$route.params.class_id}/posts`).doc(post.id).update({
//       tags: ["Discussion Section (April 4)"]
//     });
//     console.log("done processing");
//   }
// }