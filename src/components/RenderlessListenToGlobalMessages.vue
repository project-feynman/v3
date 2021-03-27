<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";
import db from "@/database.js"; 

export default {
  mixins: [
    DatabaseHelpersMixin
  ],
  data () {
    return {
      allMessages: [],
      unsubMessagesListener: null
    };
  },
  async created () {
    this.$emit("created");
    this.unsubMessagesListener = this.$_bindVarToDB({
      varName: "allMessages",
      dbRef: db.collection("globalMessages").orderBy("timestamp"),
      component: this
    }); 
  },
  render () {
    return this.$scopedSlots.default({
      allMessages: this.allMessages
    });
  },
  destroyed () {
    this.unsubMessagesListener(); 
  }
};
</script>