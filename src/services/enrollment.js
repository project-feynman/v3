import db from '@/database.js'
import firebase from "firebase/app";
import "firebase/firestore";
import {initClassesService} from '../dep';
import CONSTANTS from "@/CONSTANTS.js";

export class Enrollment {
    constructor () {
        this.classesService = initClassesService();
    }

    getEnrolledClasses(user) {
        return user.enrolledClasses;
    }

    async addClass (user, className) {
        const classID = await this.classesService.getClassID(className);
        
        const userRef = db.collection("users").doc(user.uid);
        const userDoc = await userRef.get()
        const enrolledClasses = userDoc.data().enrolledClasses;
        if (!enrolledClasses) { enrolledClasses = []; }
        
        // Abort if user is already enrolled in this class
        for (const classObj of enrolledClasses) {
            if (classObj.ID === classID) { return; }
        }

        const classObj = {
            ID: classID,
            name: className,
            notifFrequency: CONSTANTS.notifFrequencyEnum.ALWAYS,
        }

        userRef.update({
            enrolledClasses: firebase.firestore.FieldValue.arrayUnion(classObj)
        })
    }

    deleteClass(user,  className) {
      // TODO
    }

    async changeNewQuestionNotif(user, className, notifFrequency) {
        let classID = await this.classesService.getClassID(className);

        let userDoc = db.collection("users").doc(user.uid);
        
        const T = `enrolledClasses.${classID}.newQuestion`;
        userDoc.update({
            [T] : notifFrequency
        })
    }
}   