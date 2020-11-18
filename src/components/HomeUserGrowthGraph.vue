<template>  
  <!-- For some reason I need to specify width and height on BOTH elements -->
  <div width="300" height="300">
    <canvas id="myChart" width="300" height="300"></canvas>
  </div>
</template>

<script>
import Chart from "chart.js"; 

// remove the grid lines
// Chart.defaults.scale.gridLines.display = false;

export default {
  mounted () {
    var ctx = document.getElementById('myChart').getContext('2d');
    const data = {
      labels: ["March 2020", "July 2020", "Sep. 2020"],
      datasets: [{
        label: "Weekly Active Users", // Name the series
        data: [0, 10, 1000], // Specify the data values array
        fill: false,
        borderColor: 'cyan', // i.e. the line color
        backgroundColor: 'cyan', // i.e. the Point and Fill color
        borderWidth: 1 // Specify bar border width
    }]};

    var myLineChart = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        yAxes: [{
          gridLines: {
            drawBorder: true,
            display: false
          }
        }]
      }
    });
  }
}
</script>