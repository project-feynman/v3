    // allowedToUpvote ({ usersWhoUpvoted }) {
    //   return this.user && usersWhoUpvoted.includes(this.user.email) === false 
    // },
    // async upvoteQuestion ({ ".key": questionID, usersWhoUpvoted }) {
    //   if (!this.user) { 
    //     return 
    //   }
    //   const ref = this.questionsRef.doc(questionID)
    //   ref.update({
    //     usersWhoUpvoted: firebase.firestore.FieldValue.arrayUnion(this.user.email)
    //   })
    //   this.fetchQuestions()
    // },

    // RECURSIVE DELETE
        // async deleteVideo() {
    //   const recursiveDelete = firebase
    //     .functions()
    //     .httpsCallable("recursiveDelete");
    //   recursiveDelete({ path: `whiteboards/${this.$route.params.video_id}` });
    //   if (this.audioFileRef) this.audioFileRef.delete();
    //   // redirect
    //   this.$router.push(`/${this.$route.params.class_id}/ranking`);
    // }

// OVERLAY CODE 
//     <!-- <v-container fill-height fluid>
//     <v-row align="center" justify="center">
//       <div>
//         <v-btn fab large dark>
//           <v-icon>play_arrow</v-icon>
//         </v-btn>
//       </div>
//     </v-row>
//   </v-container>-->

// TAGS
// <!--
// <v-container v-if="withTags">
//   <div id="Tags">
//     <SearchBar
//     label="Enter a Tag"
//     :items="tagsPool"
//     @submit="addTag"
//     />
    
//     <Tags
//     :items="postTags"
//     :removable="true"
//     @delete="deleteTag"
//     />
//   </div>
// </v-container>-->

// async saveVideo ({ ".key": postId, blackboardId, description }) {
//     this.answersRef.doc(postId).update({
//       isSaved: true
//     });
//     const blackboardRef = this.classRef.collection("blackboards").doc(blackboardId);
//     await blackboardRef.update({
//       description,
//       tabNumber: 0
//     });
//   },