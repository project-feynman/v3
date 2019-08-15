<template>
  <div class="cn">
  <!-- <div class="blue-square-container">
    <div class="blue-square"></div>
  </div> -->
  <div class="yellow-square inner"></div>
  </div>
</template>
<script>
export default {

}
</script>
<style>
.blue-square-container {
  text-align: center;
}

.blue-square {
  background-color: #0074D9;
  width: 50px;
  height: 50px;
  display: inline-block;
}

.yellow-square {
  background-color: #FFDC00;
  /* display: inline-block; */
  width: 50px;
  height: 50px;
  margin: 0 auto;
}

.cn {
  display: table-cell;
  width: 500px;
  height: 500px;
  vertical-align: middle;
  text-align: center;
}

/* .inner {

  width: 200px; height: 200px;
} */
</style>