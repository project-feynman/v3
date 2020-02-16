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
    dbRef: {
      type: Object,
      required: true
    }
  },
  mixins: [DatabaseHelpersMixin],
  data: () => ({ fetchedData: [] }),
  async created () {
    this.fetchedData = await this.$_dbMixin_getDoc(this.dbRef);
  }
}
</script>