<template>
    <div id="tags">
        <div v-if="removable">
            <v-chip v-for="(item, i) in items"
            :key="i"
            close
            @click:close="close(item)"
            >
            {{item}}
            </v-chip>
        </div>
        <div v-else>
            <v-chip v-for="(item, i) in items"
            :key="i"
            >
            {{item}}
            </v-chip>
        </div>
    </div>
</template>

<script>
export default {
    props : {
        items: Array,
        removable: Boolean,
    },
    methods : {
        close(item) { 
            this.$emit("delete", item)
        }
    }
}
    //Start of Tags functions
    // addTag (tag) {
    //   for (let t of this.postTags) {
    //     if (t == tag) return;
    //   }
    //   this.postTags.push(tag)
    // },
    // deleteTag(tag) {
    //   this.postTags = this.postTags.filter(x => {
    //     return x != tag;
    //   });
    // }
    //End of Tags functions
</script>

