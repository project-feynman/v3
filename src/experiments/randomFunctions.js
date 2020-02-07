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

        // async deleteVideo() {
    //   const recursiveDelete = firebase
    //     .functions()
    //     .httpsCallable("recursiveDelete");
    //   recursiveDelete({ path: `whiteboards/${this.$route.params.video_id}` });
    //   if (this.audioFileRef) this.audioFileRef.delete();
    //   // redirect
    //   this.$router.push(`/${this.$route.params.class_id}/ranking`);
    // }