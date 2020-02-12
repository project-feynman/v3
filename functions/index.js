const firebase_tools = require("firebase-tools");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require('@sendgrid/mail');
const adminCredentials = require("./adminCredentials.json");
const { SENDGRID_API_KEY } = require("./sendgrid.json");

admin.initializeApp({
	credential: admin.credential.cert(adminCredentials),
	databaseUrl: "https://feynman-mvp.firebaseio.com"
});
const firestore = admin.firestore();
sgMail.setApiKey(SENDGRID_API_KEY);

function sendEmail (email, subject, text, html) {
  sgMail.send({ to: email, from: "feynmannotif@gmail.com", subject, text, html });
}

function getDocFromDb (ref) {
  return new Promise(async (resolve, reject) => {
    const doc = await ref.get();
    if (doc.exists) { resolve({"id": doc.id, ...doc.data()}); }  // TODO: throw an explicit error
    else { reject(); }
  })
}

exports.onUserStatusChanged = functions.database.ref("/status/{uid}").onUpdate(async (change, context) => {
  const eventStatus = change.after.val(); // data written to Firebase: console.log(eventStatus) --> { isOnline: false }
  const firestoreUserRef = firestore.doc(`/users/${context.params.uid}`); // get associated mirror document
  // If the current timestamp for this data is newer than the data that triggered this event, we exit this function.
  const statusSnapshot = await change.after.ref.once("value");
  const status = statusSnapshot.val();
  if (status.last_changed > eventStatus.last_changed) { return null; }
  else { firestoreUserRef.update(eventStatus); }
});

// Updates blackboard participants when people join and leave
exports.onWorkspaceParticipantsChanged = functions.database.ref("/workspace/{firebaseClassId}/{workspaceId}").onUpdate((change, context) => {
  const userWhoLeft = change.after.val();
  if (!userWhoLeft.uid) { return; }
  const { workspaceId, firebaseClassId } = context.params;
  const classId = firebaseClassId.replace("-", ".");
  const workspaceRef = firestore.doc(`/classes/${classId}/workspaces/${workspaceId}`);
  workspaceRef.update({
    members: admin.firestore.FieldValue.arrayRemove(userWhoLeft)
  });
});

// Sends email to entire class whenever a new question is created
exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/posts/{postId}").onCreate(async post => {
  const { mitClass } = post.data();
  const classSetting = { id: mitClass.id, name: mitClass.name, notifFrequency: "always" };
  const classmatesRef = firestore.collection("users").where("enrolledClasses", "array-contains", classSetting);
  const classmatesDocs = await classmatesRef.get();
  classmatesDocs.forEach(classmateDoc => {
    const { firstName, email } = classmateDoc.data();
    const recipient = email;
    const subject = `Your classmate ${firstName} posted something`;
    const html = `<h2>Title: ${post.data().title}</h2><p>Description: ${post.data().description}</p>`;
    sendEmail(recipient, subject, "random text", html);
  })
});

exports.emailOnNewExplanation = functions.firestore.document("/classes/{classId}/posts/{postId}/explanations/{explanationId}").onCreate(async (explanation, context) => {
  const { postId, classId } = context.params;
  const originalPost = await getDocFromDb(firestore.doc(`/classes/${classId}/posts/${postId}`));
  const postCreator = await getDocFromDb(firestore.doc(`/users/${originalPost.creator.uid}`));
  const { creator: explanationCreator, title, description } = explanation.data();
  if (postCreator.email === explanationCreator.email) { return; }
  const subject = `${explanationCreator.firstName} replied to your post`;
  const html = `<h2>Title: ${title}</h2>
                <p>Description: ${description}</p>`;
  sendEmail(
    postCreator.email, 
    subject, 
    "This is some random text",
    html
  );
});

exports.recursiveDelete = functions.runWith({ timeoutSeconds: 540, memory: "2GB" })
  .https.onCall((data, context) => {
    const { path } = data;
    return firebase_tools.firestore
      .delete(path, {
        project: process.env.GCLOUD_PROJECT,
        recursive: true,
        yes: true,
        token: functions.config().fb.token // 'token' must be set in the functions config, and can be generated at the command line by running 'firebase login:ci'.
      })
      .then(() => ({ path }));
  });

      // // Only allow admin users to execute this function.
    // if (!(context.auth && context.auth.token && context.auth.token.admin)) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'Must be an administrative user to initiate delete.'
    //   );
    // }

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

