const firebase_tools = require("firebase-tools");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const sgMail = require('@sendgrid/mail');
const adminCredentials = require("./adminCredentials.json");
const { SENDGRID_API_KEY } = require("./sendgrid.json");
const algoliasearch = require('algoliasearch')
const { APP_SID, ADMIN_API_KEY } = require('./algoliaCreds.json')
const algoliaClient = algoliasearch(APP_SID, ADMIN_API_KEY);

admin.initializeApp({
	credential: admin.credential.cert(adminCredentials),
	databaseURL: "https://feynman-mvp.firebaseio.com"
});

const firestore = admin.firestore();
const firebaseDB = admin.database();
sgMail.setApiKey(SENDGRID_API_KEY);

function sendEmail (to, subject, body) {
  try {
    sgMail.send({
      to,
      subject,
      html: body,
      from: "feynman.team@gmail.com", // "no-reply@explain.mit.edu"
      text: subject,
    });
  } catch (reason) {
    console.log("SendGrid failed to send email, reason =", reason);
    throw new Error(reason);
  }
}

// TODO: throw an explicit error
function getDocFromDb (ref) {
  return new Promise(async (resolve, reject) => {
    const doc = await ref.get();
    if (doc.exists) { 
      resolve({  id: doc.id, ...doc.data() }); 
    } else {
      reject(); 
    }
  });
}

function getRandomId () {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let autoId = '';
  for (let i = 0; i < 20; i++) {
    autoId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return autoId;
}

// exports.onUserStatusChanged = functions.database.ref("/status/{uid}").onUpdate(async (change, context) => {
//   const eventStatus = change.after.val(); // data written to Firebase: console.log(eventStatus) --> { isOnline: false }
//   const firestoreUserRef = firestore.doc(`/users/${context.params.uid}`); // get associated mirror document
//   // If the current timestamp for this data is newer than the data that triggered this event, we exit this function.
//   const statusSnapshot = await change.after.ref.once("value");
//   const status = statusSnapshot.val();
//   if (status.last_changed > eventStatus.last_changed) { return; }
//   else { firestoreUserRef.update(eventStatus); }
// });

/**
 * `.onWrite` is Triggered on any mutation event: when data is created, updated, or deleted in the Realtime Database.
 * */
exports.onClassParticipantsChanged = functions.database.ref("/class/{classID}/room/{roomID}/participants/{disconnectID}").onWrite((change, context) => {
  // `change` has a `before` and `after` property, which each has a `_data` property that looks like `{ hasDisconnected: true }`
  console.log("change.after =", change.after);
  const { classID, roomID, disconnectID } = context.params;
  
  // for backwards compatibility
  firestore.doc(`/classes/${classID}/participants/${disconnectID + roomID}`).delete(); 

  return firestore.doc(`/classes/${classID}/participants/${disconnectID}`).delete();
})

function getEmailBody (explDoc, classId, postId) { // assumes .data() has been called already
  return `
    <h3>${explDoc.title}</h3>
    <p>${explDoc.description ? explDoc.description : "" }</p>
    <img src="${explDoc.thumbnail ? explDoc.thumbnail : "" }"></img>
    <a href="https://explain.mit.edu/class/${classId}/questions/${postId}">Click here to view.</a>
  `; 
}

exports.emailOnNewPost = functions.firestore.document("/classes/{classId}/questions/{postId}").onCreate(async (newPostDoc, context) => {
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

exports.emailOnNewReply = functions.firestore.document("/classes/{classId}/questions/{postId}/explanations/{explanationId}").onCreate(async (newReplyDoc, context) => {
  const { classId, postId } = context.params;
  const originalPost = await getDocFromDb(firestore.doc(`/classes/${classId}/questions/${postId}`));
  for (let participant of originalPost.participants) {
    const newReply = newReplyDoc.data(); 
    const userRef = firestore.collection("users").where("uid", "==", participant.uid);
    const userDocs = await userRef.get();
    userDocs.forEach((userDoc) => {
      const currParticipant = userDoc.data();
      if (currParticipant.uid !== newReply.creator.uid && currParticipant.emailOnNewReply.includes(classId)) { 
        sendEmail(
          currParticipant.email, 
          `${newReply.creator.firstName} replied in a ${newReply.mitClass.name} post you engaged in`,
          getEmailBody(newReply, classId, postId)
        );
      }
    })
      
  }
});

const emailSummaryFrequencyEnum = {
  WEEKLY: "Weekly",
  DAILY: "Daily"
}

async function sendEmailToSubscribers (context, frequency) { // frequency can be `Weekly` or `Daily` 
  const classesRef = firestore.collection("classes");
  const classesDocs = await classesRef.get();
  classesDocs.forEach(async (mitClassDoc) => {
    const subscribedUsersQuery = firestore.collection("users").where(`email${frequency}Summary`, "array-contains", mitClassDoc.id);
    const subscribedUsersDocs = await subscribedUsersQuery.get();
    const summaryEmail = await createDailySummaryEmail(frequency);
    subscribedUsersDocs.forEach((userDoc) => {
      sendEmail(
        userDoc.data().email, 
        `${mitClassDoc.data().name}'s ${frequency} Summary from ExplainMIT`,
        summaryEmail
      );  
    });
  }); 
}

function getYesterday () {
  const d = new Date();
  d.setDate(d.getDate() - 1); // `date` := day of the month e.g. 23
  return d.toISOString(); // .toISOString standardizes to UTC
}

function getLastWeek () {
  const d = new Date();
  d.setDate(d.getDate() - 7); // `date` := day of the month e.g. 23
  return d.toISOString(); // .toISOString standardizes to UTC
}

// async function createSummaryEmail (dailyOrWeekly) {
//   // const mostViewedExplQuery = db.collectionGroup("explanations").orderBy("views").limit(3);
//   // const repliesRef = firestore.collectionGroup("explanations").where("date", ">=", yesterday);
//   // const repliesDocs = await repliesRef.get();
//   // repliesDocs.forEach((replyDoc) => allExplanations.push({ id: replyDoc.id, ...replyDoc.data() }));
//   const allExplanations = [];
//   let postsRef; 
//   if (dailyOrWeekly === emailSummaryFrequencyEnum.DAILY) {
//     postsRef = firestore.collectionGroup("questions").where("date", ">", getYesterday());
//   } else if (dailyOrWeely === emailSummaryFrequencyEnum.WEEKLY) {
//     postsRef = firestore.collectionGroup("questions").where("date", ">", getLastWeek());
//   }
//   const postsDocs = await postsRef.get();
//   postsDocs.forEach((postDoc) => allExplanations.push({ id: postDoc.id, ...postDoc.data() }));
//   allExplanations.sort((a, b) => (a.date < b.date) ? -1 : ((a.date > b.date) ? 1 : 0));
//   console.log("allExplanations =", allExplanations);
//   const topExpl = allExplanations[0];
//   return `
//     <h1>Most viewed post: ${topExpl.title}</h1> 
//     <p>${topExpl.description ? topExpl.description : ""}</p>
//     ${ topExpl.thumbnail ? `<img src="${topExpl.thumbnail}"></img>` : "" }
//     <a href="https://explain.mit.edu/class/${topExpl.mitClass.id}/questions/${topExpl.id}">Click here to view.</a>
//   `;
// }

// Daily Summary
exports.emailDailySummary = functions.pubsub
  .schedule("5 7 * * *") // every day at 7:05
  .timeZone('America/New_York') // Users can choose timezone - default is America/Los_Angeles
  .onRun(async (context) => sendEmailToSubscribers(context, emailSummaryFrequencyEnum.DAILY));

// Weekly Summary
exports.emailWeeklySummary = functions.pubsub
  .schedule("every monday 07:05")
  .timeZone("America/New_York")
  .onRun((context) => sendEmailToSubscribers(context, emailSummaryFrequencyEnum.WEEKLY));


/**
 * Helper function for saving an explanation. It saves the strokesArray as the subcollection 
 * of an expl doc. 
 */

function uploadStrokesToDatabase ({ strokesArray, databaseRef }) {
  return new Promise(async (resolve, reject) => {
    try {
      const promises = [];
      let currentBatch = firestore.batch();
      let currentBatchSize = 0; 
      const maxBatchSize = 500; 

      for (const stroke of strokesArray) {
        if (currentBatchSize >= maxBatchSize) {
          promises.push(currentBatch.commit());
          currentBatch = firestore.batch(); 
          currentBatchSize = 0; 
        } 
        currentBatch.set(databaseRef.doc(getRandomId()), stroke);
        currentBatchSize += 1;
      }
      promises.push(currentBatch.commit()); 
      await Promise.all(promises);
      console.log("successfully saved the strokes to the database"); 
      resolve();
    } catch (reason) {
      console.log("failed, reason =", reason);
      reject(reason);
    }
  });
}

/**
 * Given a reference to the blackboard document, it saves it as an ANIMATION (for now)
 *    - Fetches the strokes 
 *    - Fetches the meta-data associated with the blackboard 
 *    - Saves it as either a post or reply (obtain from the property `explKind`)
 */
exports.saveExpl = functions
  .runWith({
    timeoutSeconds: 60, memory: "1GB"
  })
  .https.onCall(async (data, context) => {
    const { boardDbPath, explDbPath, mitClass, user, title } = data; 
      
    // THE BELOW IS USEFUL FOR TESTING CLOUD FUNCTIONS LOCALLY
    // type the following command
    // saveExpl({ "boardDbPath": "classes/mDbUrvjy4pe8Q5s5wyoD/blackboards/M1v0XzFtwP1RLKxsMR4K", "explDbPath": "classes/mDbUrvjy4pe8Q5s5wyoD/posts/abcdefghijklmnopqrstuvwxyz" });
    // "classes/mDbUrvjy4pe8Q5s5wyoD/blackboards/M1v0XzFtwP1RLKxsMR4K"
    // "classes/mDbUrvjy4pe8Q5s5wyoD/posts/"abcdefghijklmnopqrstuvwxyz"

    // fetch the aspect ratio
    const boardSnapshot = await firestore.doc(boardDbPath).get(); 

    // fetch the strokes from the blackboard
    const strokesRef = firestore.collection(`${boardDbPath}/strokes`);
    const collectionSnapshot = await strokesRef.get(); 
    console.log("collectionSnapshot =", collectionSnapshot); 
    console.log("boardDbPath =", boardDbPath); 
    const strokesArray = []; 
    if (collectionSnapshot.docs.length === 0) {
      return {
        message: "The board is actually empty - terminating the save operation.",
        boardDbPath
      };
    }
    collectionSnapshot.docs.forEach(doc => {
      strokesArray.push({
        id: doc.id,
        ref: doc.ref.path, // TODO: could cause a bug
        ...doc.data()
      });
    })
    console.log("trying to upload strokes to the database");
    uploadStrokesToDatabase({ 
      strokesArray, 
      databaseRef: firestore.collection(`${explDbPath}/strokes`)
    });

    await Promise.all([collectionSnapshot, boardSnapshot]);
    console.log("boardSnapshot.data() =", boardSnapshot.data());

    const PPT_SLIDE_RATIO = 3/4; 
    const PDF_RATIO = 11/8.5; 
    
    // save the explanation doc
    // for now it doesn't contain properties such as imageURL, audioURL, and thumbnail
    await firestore.doc(explDbPath).set({
      title,
      html: "",
      date: new Date().toISOString(),
      creator: {
        email: user.email,
        uid: user.uid,
        firstName: user.firstName,
        lastName: user.lastName
      },
      order: parseInt(mitClass.maxOrder + 1) || 1,
      mitClass,
      tags: [],
      duration: 0,
      hasStrokes: strokesArray.length > 0,
      aspectRatio: boardSnapshot.data().isVertical ? PDF_RATIO : PPT_SLIDE_RATIO
    });
    console.log("successfully saved the explanation into the database");
    return { message: "Successfully saved the explanation as an animation", explDbPath };
  });

/**
 * Currently used to delete the strokes for the documents. 
 */
exports.recursiveDelete = functions
  .runWith({ 
    timeoutSeconds: 540, memory: "2GB" 
  })
  .https.onCall(async (data, context) => {
    // Only allow admin users to execute this function.
    // if (!(context.auth && context.auth.token && context.auth.token.admin)) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'Must be an administrative user to initiate delete.'
    //   );
    // }
    const path = data.path;
    console.log(`Requested to delete path ${path}`);
    // return "success";
    // recursiveDelete({ "path": "/classes/mDbUrvjy4pe8Q5s5wyoD/blackboards/M1v0XzFtwP1RLKxsMR4K/strokes" })

    // Run a recursive delete on the given document or collection path.
    // The 'token' must be set in the functions config, and can be generated
    // at the command line by running 'firebase login:ci'.
    return firebase_tools.firestore.delete(path, {
      project: process.env.GCLOUD_PROJECT,
      recursive: true,
      yes: true,
      // token: functions.config().fb.token
    });
    // console.log("await complete - successfully deleted, returning now");
    // return {
    //   path: path 
    // };
});

exports.sendEmailToPerson = functions.https.onCall(({ title, contentHTML, emailOfPerson }) => {
  sendEmail(
    emailOfPerson,
    title,
    contentHTML
  ); 
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

// exports.onNewPost = functions.firestore.document('/classes/{classId}/{postType}/{postId}').onCreate((snap, context) => {
//   const post = snap.data()
//   const { classId, postType, postId } = context.params;
//   const alogoliaObj = {
//     title: post.title,
//     html: post.html,
//     creator: post.creator,
//     date: post.date,
//     mitClass: post.mitClass,
//     postType: postType,
//     objectID: postId,
//   }
//   const index = algoliaClient.initIndex(classId)
//   index.saveObject(alogoliaObj)
//   return
// })

// exports.onDeletePost = functions.firestore.document('/classes/{classId}/{postType}/{postId}').onDelete((snap, context) => {
//   const { classId, postType, postId } = context.params;
//   const index = algoliaClient.initIndex(classId)
//   index.deleteObject(postId)
//   return
// })

