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
    name: "Tags",
    data() {
        return {

        }
    },
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
</script>