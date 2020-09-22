<template>
  <v-app>
    <v-card width="1000" height="800" color="grey">
      <h1>Welcome to the library playground!</h1>
      <v-row>
        <!-- By default, the sidedrawer and videos each take up 5 columns -->
        <!-- But if it's a medium / larger screen, we can afford fewer columns for the side-drawer -->
        <v-col cols="6" md="3">
          <!-- Within the SideDrawer itself, it's a vertical flex -->
          <div class="d-flex flex-column mb-6">
            <v-card v-for="n in 3" :key="n"
              class="pa-2"
              outlined
              tile
            >
              Post {{ n }}
            </v-card>
          </div>
        </v-col>

        <v-col cols="6" md="7">
          <!-- Within the list of videos, it's also a vertical flex -->
          <div  class="d-flex flex-column mb-6">
            The explanations will be listed vertically here as well
          </div>
        </v-col>
      </v-row>
    </v-card>
  </v-app>
</template>

<script>
export default {
  data () {
    return {

    };
  }
};
</script>