import db from '@/database.js'

export class Tags {
    constructor(classID) {
        this.classDoc = db.collection("classes").doc(classID)
        this.tree = {'tree' : []}
    }

    getTags(){
        this.classDoc.get().then(doc => {
            return doc.data().tags.keys()
        })
    }

    addTag(tag, parent){
        this.tree = {classID : []}
        this.classDoc.get().then(doc => {
            let tags = doc.data().tags
            for(tag in tags){
                let taginfo = tags[tag]
                if(!(tag in this.tree))
                    this.tree[tag] = []
                if(!(taginfo.parent in this.tree))
                    t
            }
        })
    }
}   