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

function sendEmail (to, subject, body) {
  try {
    sgMail.send({
      to,
      subject,
      html: body,
      from: "feynmannotif@gmail.com", // "no-reply@explain.mit.edu"
      text: subject,
    });
  } catch (reason) {
    console.log("SendGrid failed to send email, reason =", reason);
    throw new Error(reason);
  }
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
    else { 
      reject(); 
    }
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

function getEmailBody (explDoc, classId, postId) { // assumes .data() has been called already
  return `
    <h3>${explDoc.title}</h3>
    <p>${explDoc.description ? explDoc.description : "" }</p>
    <img src="${explDoc.thumbnail ? explDoc.thumbnail : "" }"></img>
    <a href="https://explain.mit.edu/class/${classId}/posts/${postId}">Click here to view.</a>
  `; 
}

exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/posts/{postId}").onCreate(async (newPostDoc, context) => {
  const { classId, postId } = context.params;
  const classmatesRef = firestore.collection("users").where("emailOnNewPost", "array-contains", classId);
  const classmatesDocs = await classmatesRef.get();
  classmatesDocs.forEach((classmateDoc) => {
    const newPost = newPostDoc.data();
    const classmate = classmateDoc.data();
    if (newPost.creator.email === classmate.email) { 
      return; 
    }
    console.log("sending to classmate =", classmate.email);
    sendEmail(
      classmate.email, 
      `${newPost.creator.firstName} posted in ${newPost.mitClass.name}`,
      getEmailBody(newPost, classId, postId)
    );
  });
});

exports.emailOnNewReply = functions.firestore.document("/classes/{classId}/posts/{postId}/explanations/{explanationId}").onCreate(async (newReplyDoc, context) => {
  const { classId, postId } = context.params;
  const originalPost = await getDocFromDb(firestore.doc(`/classes/${classId}/posts/${postId}`));
  for (let participant of originalPost.participants) {
    const newReply = newReplyDoc.data(); 
    console.log("classId =", classId);
    console.log("participant.email =", participant.email);
    console.log("newReply.creator.email =", newReply.creator.email);
    if (participant.email === newReply.creator.email) { 
      continue; 
    } else if (participant.emailOnNewReply.includes(classId)) { 
      sendEmail(
        participant.email, 
        `${newReply.creator.firstName} replied in a ${newReply.mitClass.name} post you engaged in`,
        getEmailBody(newReply, classId, postId)
      );
    }
  }
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
      sendEmail(user.email, subject, body);
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
  for (let email of ourEmails) {
    sendEmail(
      email, 
      `New feedback from a user!`,
      `<h1>${data.userEmail} said ${data.userFeedback}</h1>`
    );
  }
});

