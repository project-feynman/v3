<template>
  <v-app>
    <v-btn @click="isPopupOpen = !isPopupOpen">Toggle popup</v-btn>
    <v-dialog v-model="isPopupOpen" persistent>
      <v-card height="300">
        <p>HELLO WORLD</p>
        <v-btn @click="isPopupOpen = false">CANCEL</v-btn>
      </v-card>
    </v-dialog>

    <v-card v-for="i in 20" height="300" :key="i">
      This is just padding for the intersection card
    </v-card>
    <v-card v-intersect.once="onIntersect">
      Ernest William Groth (May 3, 1922 – December 27, 2004) was an American Major League Baseball right-handed pitcher who played for three seasons. He played for the Cleveland Indians during the 1947 and 1948 seasons and the Chicago White Sox during the 1949 season. In four career games, Groth pitched 7⅓ innings and had a 4.91 earned run average (ERA).
      Born and raised in Pennsylvania, Groth began his professional career in the Wisconsin State League in 1942. After his rookie season, he spent the next three years serving in the military during World War II. After he returned, he spent more time in the minor leagues, then spent parts of the 1947 and 1948 seasons with the Cleveland Indians. After the end of the 1948 season, he was traded to the Chicago White Sox, and played with them in 1949. He spent the next seven seasons pitching in the minor leagues, retiring at the end of the 1956 season. After his retirement, he ran Groth's Nursery and worked for Standard Steel, and died in 2004.
    </v-card>
  </v-app>
</template>

<script>
  export default {
    data () {
      return {
        isPopupOpen: false
      };
    },
    methods: {
      // Will be invoked once at mount and once when it intersects
      // After the intersection the callback unbinds
      // Can be used with the quiet modifier
      onIntersect (entries, observer, isIntersecting) {
        console.log("entries =", entries);
        console.log("observer =", observer);
        console.log("isIntersecting =", isIntersecting);
      }
    }
  }
</script>
