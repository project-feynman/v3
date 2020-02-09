const firebase_tools = require("firebase-tools");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const config = require("./config");
const sgMail = require('@sendgrid/mail');
const adminCredentials = require('./feynman-mvp-firebase-adminsdk-d10vx-70c5b69675.json') // might be disactivated

admin.initializeApp({
	credential: admin.credential.cert(adminCredentials),
	databaseUrl: "https://feynman-mvp.firebaseio.com"
});
const firestore = admin.firestore();
sgMail.setApiKey('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');

function sendEmail (email, subject, text, html) {
  const msg = {
    to: email,
    from: "feynmannotif@gmail.com",
    subject: subject,
    text: text,
    html: html,
  };
  console.log("message", msg);
  sgMail.send(msg);
}

exports.onUserStatusChanged = functions.database.ref("/status/{uid}").onUpdate(
  async (change, context) => {
    // Get the data written to Realtime Database
    const eventStatus = change.after.val(); // console.log(eventStatus) --> { isOnline: false }

    // Then use other event data to create a reference to the corresponding Firestore document.
    const firestoreUserRef = firestore.doc(`/users/${context.params.uid}`);

    // multiple requests may have been triggered, but earlier requests might not actually resolve earlier therefore it's necessary to compare the timestamps
    const statusSnapshot = await change.after.ref.once("value");
    const status = statusSnapshot.val();

    // If the current timestamp for this data is newer than the data that triggered this event, we exit this function.
    if (status.last_changed > eventStatus.last_changed) return null;
    // eventStatus.last_changed = new Date(eventStatus.last_changed)
    return firestoreUserRef.update(eventStatus);
  }
);

// Updates blackboard participants when people join and leave
exports.onWorkspaceParticipantsChanged = functions.database.ref("/workspace/{class_id}/{workspace_id}").onUpdate(
  (change, context) => {
    const userWhoLeft = change.after.val();
    if (!userWhoLeft.uid) return;

    // update participants
    const firebaseClassID = context.params.class_id.replace("-", ".");
    const workspaceFirestoreRef = firestore.doc(`/classes/${firebaseClassID}/workspaces/${context.params.workspace_id}`);
    workspaceFirestoreRef.update({
      members: admin.firestore.FieldValue.arrayRemove(userWhoLeft)
    });
  }
);

// Sends email to entire class whenever a new question is created
exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/posts/{postId}").onCreate(async doc => {
  const post = doc.data();
  const classObj = {
    id: post.mitClass.id,
    name: post.mitClass.name,
    notifFrequency: "always"
  }
  
  // Email all classmates
  const classmatesRef = firestore.collection("users").where("enrolledClasses", "array-contains", classObj);
  const classmatesDocs = await classmatesRef.get();
  classmatesDocs.forEach(classmateDoc => {
    const { email, title, description } = classmateDoc.data();
    sendEmail(email, `Your classmate asked a question`, `Question title: ${title}`, `<h1>${description}</h1>`);
  })
});

exports.emailOnNewAnswer = functions.firestore.document("/classes/{classId}/posts/{postId}/explanations/{explanationId}").onCreate(async (explanationDoc, context) => {
  const { postId, classId } = context.params;
  // Get original post
  const postRef = firestore.doc(`/classes/${classId}/posts/${postId}`);
  let post = await postRef.get();
  if (!post.exists) return;  // TODO: throw an explicit error
  post = post.data();

  // Get creator of original question
  const creatorRef = firestore.doc(`/users/${post.creator.uid}`);
  let creatorDoc = await creatorRef.get();
  if (!creatorDoc.exists) return; 
  creatorDoc = creatorDoc.data();

  const subject = `Your question was answered by ${ explanationDoc.creator.firstName }`
  const { title, description } = explanationDoc.data();
  sendEmail(creatorDoc.email, subject, `Explanation title: ${title}`, `<p>Description: ${description}</p>`)
});

// /* AUTO-CREATED FUNCTIONS */
// /**
//  * Callable function that creates a custom auth token with the
//  * custom attribute "admin" set to true.
//  *
//  * See https://firebase.google.com/docs/auth/admin/create-custom-tokens
//  * for more information on creating custom tokens.
//  *
//  * @param {string} data.uid the user UID to set on the token.
//  */
// exports.mintAdminToken = functions.https.onCall((data, context) => {
//   const uid = data.uid;

//   return admin
//     .auth()
//     .createCustomToken(uid, { admin: true })
//     .then(function(token) {
//       return { token: token };
//     });
// });

exports.recursiveDelete = functions
  .runWith({
    timeoutSeconds: 540,
    memory: "2GB"
  })
  .https.onCall((data, context) => {
    // // Only allow admin users to execute this function.
    // if (!(context.auth && context.auth.token && context.auth.token.admin)) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'Must be an administrative user to initiate delete.'
    //   );
    // }

    const { path } = data;
    console.log(`User ${context.auth.uid} has requested to delete path ${path}`);

    // The 'token' must be set in the functions config, and can be generated
    // at the command line by running 'firebase login:ci'.
    return firebase_tools.firestore
      .delete(path, {
        project: process.env.GCLOUD_PROJECT,
        recursive: true,
        yes: true,
        token: functions.config().fb.token
      })
      .then(() => ({
        path
      }));
  });
