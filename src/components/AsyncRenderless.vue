<template>
  <div>
    <slot :fetchedData="fetchedData">
  
    </slot>
  </div>
</template>

<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: { 
    dbRef: Object 
  },
  mixins: [DatabaseHelpersMixin],
  data: () => ({ 
    fetchedData: [] 
  }),
  async created () { 
    this.fetchedData = await this.$_getDoc(this.dbRef); 
  }
}
</script>