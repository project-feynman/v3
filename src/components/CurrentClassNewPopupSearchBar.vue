<template>
  <!-- return object means payload from @change will be the object
  even though the display name is just object.name -->
  <v-autocomplete
    :items="itemsWithMemberCount"
    item-text="nameWithMemberCount"
    @change="(newClass) => handleChange(newClass)"
    return-object 
    prepend-inner-icon="mdi-magnify"
    clearable 
    ref="VAutocomplete"
    hide-details
    flat
    placeholder="Search class"
    color="teal"
    outlined
  /> 
  <!-- TODO: search by description also, better formatting -->
  <!-- TODO: create a way to create new clases, but it's not necessary right now, you have bigger problems in that nobody is using the product -->
</template>

<script>
export default {
  props: { 
    label: String, 
    items: Array 
  },
  computed: {
    itemsWithMemberCount () {
      const sortedItems = this.items.sort((i1, i2) => i2.numOfMembers - i1.numOfMembers)
      const out = []
      for (const item of sortedItems) {
        out.push({ ...item, nameWithMemberCount: `${item.name} (${item.numOfMembers || 0} members)`})
      }
      return out
    }
  },
  data () {
    return { 
      searchInput: ""
    };
  },
  methods: {
    handleChange (newClass) {
      const { VAutocomplete } = this.$refs;
      this.$emit("submit", newClass);
      VAutocomplete.reset();
      VAutocomplete.blur();
    }
  }
};
</script>