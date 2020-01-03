<template>
    <!-- "height: 100%" is necessary or else the canvas contained within will be squished-->
    <div style="height: 100%">
        <slot :strokes="strokes">
            {{ strokes }}
        </slot>
    </div>
</template>

<script>
    import db from "@/database.js"

    export default {
        props: {
            whiteboardID: String,
            hasSubcollection: {
                type: Boolean,
                default() {
                    return true
                }
            }
        },
        data() {
            return {
                strokes: []
            }
        },
        async created() {
            if (!this.whiteboardID) {
                return
            }
            const baseRef = db.collection("whiteboards").doc(this.whiteboardID);
            if (this.hasSubcollection === false) {
                const doc = await baseRef.get();
                this.strokes = doc.data().strokes
            } else {
                const strokesRef = baseRef.collection("strokes").orderBy("strokeNumber", "asc");
                strokesRef.get().then(querySnapshot => {
                    querySnapshot.forEach(doc => {
                        this.strokes.push({".key": doc.id, ...doc.data()})
                    })
                })
            }
        }
    }
</script>