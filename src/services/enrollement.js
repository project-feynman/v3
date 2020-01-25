import db from '@/database.js'
import {encodeKey} from '../dep'

export class Enrollement {
    constructor () {}
    addClass (user, className) {
        console.log("add user, className =", user, className)
        let classID = encodeKey(className)
        let userDoc = db.collection("users").doc(user.uid)
        userDoc.get().then(doc => {
            // TODO: please rename A
            let A = {...doc.data()}.enrolledClasses
            if (!A || Array.isArray(A)) A = {};
            if (classID in A) return;
            var classObj = {
                name: className,
                settings: {
                notifications: {
                    newQuestion: "always",
                  },
                }
            }

            A[classID] = classObj
            userDoc.set(
                {enrolledClasses : A},
                {merge: true})
        })
    }

    deleteClass(user, className) {
        let classID = encodeKey(className)
        let userDoc = db.collection("users").doc(user.uid)
        userDoc.get().then(doc => {
            let A = {...doc.data()}.enrolledClasses

            if(!(classID in A))return
            
            delete A[classID]
            
            userDoc.set(
                {enrolledClasses : A},
                {merge: true})
        })
    }

    changeNotification(user, className, notifType, notifFrequency) {
        let classID = encodeKey(className)
        let userDoc = db.collection("users").doc(user.uid)
        const K = `enrolledClasses.${classID}.settings.notifications.${notifType}`
        userDoc.update({
             [K] : notifFrequency
        })
    }
}   