const admin = require('firebase-admin')
const functions = require('firebase-functions');
const firebase_tools = require('firebase-tools')
const webpush = require('web-push')

admin.initializeApp()

const firestore = admin.firestore()
firestore.settings({timestampsInSnapshots: true})

exports.notificationOnNewMessage = functions.firestore.document('/students/{uid}/messages/{mid]').onCreate((doc, context) => {
	const params = context.params;

	const messageId = params.mid;
	const chatroomUid = params.uid;

	const author = doc.author;
	const authorName = author.displayName;
	const authorUid = author.uid

	receivers = firestore.collection('/students/' + chatroomUid + '/participants/')
	receivers.listDocuments().then(documentRefs => {
		return firestore.getAll(documentRefs)
	}).then(receiverSnaps => {
		documentSnaps.forEach(documentSnap => {
			const currentUid = documentSnap.data().uid
			const userDocRef = firestore.doc('/students/' + currentUid)
			userDocRef.get().then(userDocSnap => {
				if(userDocSnap.exists) {
					var receiverSubscriptions = userDocSnap.data().subscriptions
					if(!receiverSubscriptions) {
						return;
					}
					receiverSubscriptions.forEach(function(sub) {
						const subscription = JSON.parse(sub)
						const payload = {
							senderName,
							body: message.content,
							type: "message"
						}
						webpush.sendNotification(subscription, JSON.stringify(payload)).catch((err) => console.log(receiverUid + '\n' + sub + '\n' + err))
					})
				}
				else {
					console.log("Nonexistent user with uid given in participants\nUid: " + currentUid)
					return null
				}
			})
		})
	})
	receiverUids = receivers.map((receiver) => receiver.uid)
	receiverUids.forEach(function(receiverUid) {
		firestore.doc('/users/' + receiverUid).get().then(async snapshot => {
			
		})
	})

	return null;
})

/* AUTO-CREATED FUNCTIONS */

exports.updateParticipantsForUserChatroom = functions.firestore.document('/students/{uid}/messages/{mid}').onCreate((doc, context) => {
	const params = context.params;
	const author = params.author;
	const authorUid = author.uid;
	const authorName = author.name

	const colref = firebase.colection("/students/" + context.params.uid + "/participants");

	colref.where("uid", "==", authorUid).then(querySnapshot => {
		if(querySnapshot.empty) {
			colref.add({
				authorUid,
				authorName
			})
		}
	})
})/**
 * Callable function that creates a custom auth token with the
 * custom attribute "admin" set to true.
 * 
 * See https://firebase.google.com/docs/auth/admin/create-custom-tokens
 * for more information on creating custom tokens.
 * 
 * @param {string} data.uid the user UID to set on the token.
 */
exports.mintAdminToken = functions.https.onCall((data, context) => {
  const uid = data.uid;

  return admin
    .auth()
    .createCustomToken(uid, { admin: true })
    .then(function(token) {
      return { token: token };
    });
});

// [START recursive_delete_function]
/**
 * Initiate a recursive delete of documents at a given path.
 * 
 * The calling user must be authenticated and have the custom "admin" attribute
 * set to true on the auth token.
 * 
 * This delete is NOT an atomic operation and it's possible
 * that it may fail after only deleting some documents.
 * 
 * @param {string} data.path the document or collection path to delete.
 */
exports.recursiveDelete = functions
  .runWith({
    timeoutSeconds: 540,
    memory: '2GB'
  })
  .https.onCall((data, context) => {
    // // Only allow admin users to execute this function.
    // if (!(context.auth && context.auth.token && context.auth.token.admin)) {
    //   throw new functions.https.HttpsError(
    //     'permission-denied',
    //     'Must be an administrative user to initiate delete.'
    //   );
    // }

    const path = data.path;
    console.log(
      `User ${context.auth.uid} has requested to delete path ${path}`
    );

    // Run a recursive delete on the given document or collection path.
    // The 'token' must be set in the functions config, and can be generated
    // at the command line by running 'firebase login:ci'.
    return firebase_tools.firestore
      .delete(path, {
        project: process.env.GCLOUD_PROJECT,
        recursive: true,
        yes: true,
        token: functions.config().fb.token
      })
      .then(() => {
        return {
          path: path 
        };
      });
  });

