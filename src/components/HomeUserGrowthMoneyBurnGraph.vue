<template>
  <div>
    <!-- <h1>Chart JS Multi-Axis</h1> -->
    <!-- <div class="wrapper">
      <canvas id="myChart"></canvas>
    </div> -->

    <!-- <h1>Chart JS Multi-Axis with suggestedMin, suggestedMax</h1> -->
    <div class="wrapper">
      <canvas id="myChart2"></canvas>
    </div>
  </div>
</template>

<script>
var data = {
    "datasets": [
      {
        "backgroundColor": "rgb(156, 39, 176)",
        "borderColor": "rgb(156, 39, 176)",
        "fill": false,
        "data": [
          10,
          120,
          80,
          134
        ],
        "id": "amount",
        "label": "Purchase amount (USD)",
				"yAxisID":"left"
      },
      {
        "backgroundColor": "rgb(39, 176, 200)",
        "borderColor": "rgb(39, 176, 200)",
        "fill": false,
        "data": [
          300,
          -1200,
          500,
          -340
        ],
        "id": "amount",
        "label": "Purchase amount (USD)",
				"yAxisID":"right"

      }
    ],
    "labels": [
      "2020-01-02",
      "2020-04-02",
      "2020-07-02",
      "2021-01-02"
    ]
  };
var options = {
    "elements": {
      "rectangle": {
        "borderWidth": 2
      }
    },
    "layout": {
      "padding": 0
    },
    "legend": {
      "display": true,
      "labels": {
        "boxWidth": 16
      }
    },
    "maintainAspectRatio": false,
    "responsive": true,
    "scales": {
      "xAxes": [
        {
          "gridLines": {
            "display": false
          },
          "scaleLabel": {
            "display": true,
            "labelString": "Date"
          },
          "stacked": false,
          "ticks": {
            "autoSkip": true,
            "beginAtZero": true
          },
          "time": {
            "tooltipFormat": "[Q]Q - YYYY",
            "unit": "quarter"
          },
          "type": "time"
        }
      ],
      "yAxes": [
        {
          "scaleLabel": {
            "display": true,
            "labelString": "Purchase amount (USD)"
          },
					"id": "left",
          "stacked": false,
          "ticks": {
            "beginAtZero": true
          }
        },
        {
          "scaleLabel": {
            "display": true,
            "labelString": "Purchase count"
          },
					"id": "right",
					"position": "right",
          "stacked": false,
          "ticks": {
            "beginAtZero": true
          }
        }
      ]
    },
    "title": {
      "display": false
    },
    "tooltips": {
      "intersect": false,
      "mode": "index",
      "position": "nearest",
      "callbacks": {}
    }
  }
var type = "line";

export default {
  mounted () {
    // var myChart = new Chart(document.getElementById("myChart").getContext('2d'), {options, data, type});
    var myChart2 = new Chart(document.getElementById("myChart2").getContext('2d'), {
      options: {
        ...options,
        scales: {
          ...options.scales,
          yAxes: [
              {
                "scaleLabel": {
                  "display": true,
                  "labelString": "Purchase amount (USD)"
                },
                "id": "left",
                "stacked": false,
                "ticks": {
                  "beginAtZero": true,
                  suggestedMin: -200,
                  suggestedMax: 200
                }
              },
              {
                "scaleLabel": {
                  "display": true,
                  "labelString": "Purchase count"
                },
                "id": "right",
                "position": "right",
                "stacked": false,
                "ticks": {
                  "beginAtZero": true,
                  suggestedMin: -2000,
                  suggestedMax: 2000
                }
              }
          ]
        }
      },
      data,
      type
    });
  }
};
</script>

<style scoped>
.wrapper{
  width: 600px;
  display:block;
  overflow:hidden;
  margin:0 auto;
  padding: 20px;
  background:#fff;
  border-radius:4px;
}

canvas{
  background:#fff;
  height:400px;
}

h1{
  font-family: Roboto;
  color: #fff;
  margin-top:50px;
  font-weight:200;
  text-align: center;
  display: block;
  text-decoration: none;
}
</style>