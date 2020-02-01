import db from '@/database.js'

export class Classes {
    constructor () {
        this.classes = [];
    }

    fetchClasses(){
        const P = new Promise(async resolve => {
            this.classes = [];
            const querySnapshot = await db.collection("classes").get()
            querySnapshot.forEach(doc => {
                let docObj = { ".key": doc.id, ...doc.data() };
                this.classes.push(docObj);
            }); 
            resolve();
        });
        return P;
    }

    async getClassID(className){
        await this.fetchClasses();
        for(let i of this.classes){
            if(i.name == className){
                return i['.key']
            }
        }
        return null;
    }
    
    async getClasses(){
        await this.fetchClasses();
        return this.classes;
    }

    async getClassData(classID) {
        await this.fetchClasses();
        for(let i of this.classes){
            if(i['.key'] == classID){
                return i;
            }
        }
        return null;
    }
}   