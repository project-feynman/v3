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
  sgMail.send({ 
    to: email, 
    from: "feynmannotif@gmail.com", 
    subject, 
    text, 
    html 
  });
}

function sendEmail2 (to, subject, body) {
  sgMail.send({
    to,
    subject,
    html: body,
    from: "no-reply@explain.mit.edu",
    text: subject,
  });
}

function getDocFromDb (ref) {
  return new Promise(async (resolve, reject) => {
    const doc = await ref.get();
    if (doc.exists) { 
      resolve({ 
        "id": doc.id, 
        ...doc.data() 
      }); 
    }  // TODO: throw an explicit error
    else { reject(); }
  })
}

exports.onUserStatusChanged = functions.database.ref("/status/{uid}").onUpdate(async (change, context) => {
  const eventStatus = change.after.val(); // data written to Firebase: console.log(eventStatus) --> { isOnline: false }
  const firestoreUserRef = firestore.doc(`/users/${context.params.uid}`); // get associated mirror document
  // If the current timestamp for this data is newer than the data that triggered this event, we exit this function.
  const statusSnapshot = await change.after.ref.once("value");
  const status = statusSnapshot.val();
  if (status.last_changed > eventStatus.last_changed) { return; }
  else { firestoreUserRef.update(eventStatus); }
});

// Updates blackboard participants when people join and leave
exports.onWorkspaceParticipantsChanged = functions.database.ref("/room/{classId}/{roomId}").onWrite((change, context) => {
  const userWhoLeft = change.after.val();
  if (!userWhoLeft.uid) { return; }
  const { roomId, classId } = context.params;
  const workspaceRef = firestore.doc(`/classes/${classId}/blackboards/${roomId}`);
  workspaceRef.update({
    participants: admin.firestore.FieldValue.arrayRemove(userWhoLeft)
  });
});

// Sends email to entire class whenever a new question is created
// exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/posts/{postId}").onCreate(async (post, context) => {
//   const { mitClass } = post.data();
//   const classSetting = { id: mitClass.id, name: mitClass.name, notifFrequency: "always" };
//   const classmatesRef = firestore.collection("users").where("enrolledClasses", "array-contains", classSetting);
//   const classmatesDocs = await classmatesRef.get();
//   classmatesDocs.forEach(classmateDoc => {
//     if (post.data().creator.email === classmateDoc.data().email) { return; }
//     const subject = `${post.data().creator.firstName} posted in ${mitClass.name}`;
//     const { classId, postId } = context.params;
//     const html = `
//       <p>${post.data().title}</p>
//       <a href="https://explain.mit.edu/class/${classId}/posts/${postId}">Link to post</a>
//     `;
//     sendEmail(classmateDoc.data().email, subject, "A new post :]", html);
//   })
// });

exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/posts/{postId}").onCreate(async (post, context) => {
  // const { mitClass } = post.data();
  // const classSetting = { id: mitClass.id, name: mitClass.name, notifFrequency: "always" };
  const classmatesRef = firestore.collection("users").where("emailOnNewPost", "array-contains", context.params.classId);
  const classmatesDocs = await classmatesRef.get();
  classmatesDocs.forEach(classmateDoc => {
    if (post.data().creator.email === classmateDoc.data().email) { return; }
    const subject = `${post.data().creator.firstName} posted in ${mitClass.name}`;
    const { classId, postId } = context.params;
    const html = `
      <p>${post.data().title}</p>
      <a href="https://explain.mit.edu/class/${classId}/posts/${postId}">Link to post</a>
    `;
    sendEmail(classmateDoc.data().email, subject, "A new post :]", html);
  })
});

// exports.emailOnNewExplanation = functions.firestore.document("/classes/{classId}/posts/{postId}/explanations/{explanationId}").onCreate(async (explDoc, context) => {
//   const { postId, classId } = context.params;
//   const originalPost = await getDocFromDb(firestore.doc(`/classes/${classId}/posts/${postId}`));
//   originalPost.participants.forEach(participant => {
//     if (participant.email === explDoc.data().creator.email) { return; }
//     const subject = `${explDoc.data().creator.firstName} replied in a ${explDoc.data().mitClass.name} post you engaged in`;
//     const html = `
//       <p>${explDoc.data().title}</p>
//       <a href="https://explain.mit.edu/class/${classId}/posts/${postId}">Link to post</a>
//     `;
//     sendEmail(participant.email, subject, "A new post activity :]", html);
//   })
// });

exports.emailOnNewReply = functions.firestore.document("/classes/{classId}/posts/{postId}/explanations/{explanationId}").onCreate(async (explDoc, context) => {
  const { postId, classId } = context.params;
  const originalPost = await getDocFromDb(firestore.doc(`/classes/${classId}/posts/${postId}`));
  originalPost.participants.forEach((participant) => {
    if (participant.email === explDoc.data().creator.email) { return; }
    if (participant.emailOnNewReply.filter((id) => id === classId).length === 0) { 
      return;
    }
    const subject = `${explDoc.data().creator.firstName} replied in a ${explDoc.data().mitClass.name} post you engaged in`;
    const html = `
      <p>${explDoc.data().title}</p>
      <a href="https://explain.mit.edu/class/${classId}/posts/${postId}">Link to post</a>
    `;
    sendEmail(participant.email, subject, "A new post activity :]", html);
  })
});

const emailSummaryFrequencyEnum = {
  WEEKLY: "Weekly",
  DAILY: "Daily"
}

async function sendEmailToSubscribers (context, frequency) { // frequency can be `Weekly` or `Daily` 
  console.log('This will be run every Monday 09:00!');
  const classesRef = db.collection("classes");
  let classesDocs = await classesRef.get();
  classesDocs = classesDocs.data();
  for (let mitClass of classesDocs) {
    const subscribedUsersQuery = db.collection("users").where(`email${frequency}Summary`, "array-contains", mitClass.id);
    let subscribedUsers = await subscribedUsersQuery.get();
    subscribedUsers = subscribedUsers.data();
    for (let user of subscribedUsers) {
      const subject = `${mitClass.name}'s ${frequency} Summary from ExplainMIT`;
      const body = `<h1>Testing the ${frequency} summary at the moment</h1>`;
      sendEmail2(user.email, subject, body);
    }     
  }
}

// Daily Summary
exports.emailDailySummary = functions.pubsub.schedule('5 7 * * *')
  .timeZone('America/New_York') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => sendEmailToSubscribers(context, emailSummaryFrequencyEnum.DAILY));

// Weekly Summary
exports.emailWeeklySummary = functions.pubsub
  .schedule("every monday 07:05")
  .timeZone("America/New_York")
  .onRun((context) => sendEmailToSubscribers(context, emailSummaryFrequencyEnum.WEEKLY));

exports.recursiveDelete = functions.runWith({ timeoutSeconds: 540, memory: "2GB" }).https.onCall((data, context) => {
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

exports.sendEmailToCoreTeam = functions.https.onCall((data, context) => {
  const ourEmails = [
    "eltonlin@mit.edu",
    "wfee@mit.edu",
    "pkafle@mit.edu"
  ];
  const subject = `NEW FEEDBACK FROM USER ${data.userEmail}! REPLY QUICKLY!`;
  for (let email of ourEmails) {
    sendEmail(email, subject, "New feedback", `<h1>${data.userEmail} said ${data.userFeedback}</h1>`);
    console.log("called sendEmail");
  }
});

