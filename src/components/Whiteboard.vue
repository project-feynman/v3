<template>
  <div class="whiteboard">
    <canvas id="myCanvas"></canvas>
  </div>
</template>

<script>
// export default {
//   mounted() {
//     const canvas = document.querySelector('myCanvas');
//     this.fitToContainer(canvas);
//   },
//   methods: {
//     fitToContainer(canvas){
//       // Make it visually fill the positioned parent
//       canvas.style.width ='100%';
//       canvas.style.height='100%';
//       // ...then set the internal size to match
//       canvas.width  = canvas.offsetWidth;
//       canvas.height = canvas.offsetHeight;
//     }
//   }
// }
</script>

<style>
#myCanvas {
  width: 100%;
  background-color: rgb(170, 221, 252)
}
</style>


