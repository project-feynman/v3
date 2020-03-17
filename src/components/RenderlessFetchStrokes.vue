<script>
import DatabaseHelpersMixin from "@/mixins/DatabaseHelpersMixin.js";

export default {
  props: {
    strokesRef: Object
  },
  mixins: [DatabaseHelpersMixin],
  data () {
    return {
      strokesArray: [],
      isLoading: false
    };
  },
  methods: {
    async fetchStrokes () {
      this.isLoading = true;
      this.strokesArray = await this.$_getCollection(this.strokesRef.orderBy("strokeNumber", "asc"));
      this.isLoading = false;
    }
  },
  render() {
    return this.$scopedSlots.default({
      fetchStrokes: this.fetchStrokes,
      strokesArray: this.strokesArray,
      isLoading: this.isLoading
    });
  }
}
</script>

