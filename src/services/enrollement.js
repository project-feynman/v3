import db from '@/database.js'
import {initClassesService} from '../dep'

export class Enrollement {
    constructor () {
        this.classesService = initClassesService();
    }

    getEnrolledClasses(user){
        return user.enrolledClasses;
    }

    async addClass (user, className) {
        let classID = await this.classesService.getClassID(className);
        
        let userDoc = db.collection("users").doc(user.uid);
        
        userDoc.get().then(doc => {
            
            let enrolledClasses = {...doc.data()}.enrolledClasses;
            
            if (!enrolledClasses || Array.isArray(enrolledClasses))
                enrolledClasses = {};
            
            if (classID in enrolledClasses) return;
            
            var classObj = {
                name: className,
                newQuestion: "always",
            };

            enrolledClasses[classID] = classObj;

            userDoc.set(
                {enrolledClasses : enrolledClasses},
                {merge: true});
        });
    }

    deleteClass(user,  className) {
        //ToDo
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