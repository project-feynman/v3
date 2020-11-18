<template>  
  <!-- For some reason I need to specify width and height on BOTH elements -->
  <div width="300" height="300">
    <canvas id="financeCostGraph" width="300" height="300"></canvas>
  </div>
</template>

<script>
import Chart from "chart.js"; 

// remove the grid lines
// Chart.defaults.scale.gridLines.display = false;

export default {
  mounted () {
    var ctx = document.getElementById("financeCostGraph").getContext('2d');
    const data = {
      labels: ["Spring 2020", "Summer 2020", "Fall 2020"],
      datasets: [{
        label: "Weekly Cost ($)", // Name the series
        data: [0, 1, 300], // Specify the data values array
        fill: false,
        borderColor: 'orange', // i.e. the line color
        backgroundColor: 'orange', // i.e. the Point and Fill color
        borderWidth: 1 // Specify bar border width
    }]};

    var myLineChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        yAxes: [{
          gridLines: {
            drawBorder: true,
            display: true
          }
        }]
      }
    });
  }
}
</script>