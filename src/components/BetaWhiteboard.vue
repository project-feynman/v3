<template>
  <div id="whiteboard">
    <div style="display: flex; justify-content: center;">
      <slot>

      </slot>
      <!-- color palette  -->
      <swatches  v-model="color" :colors="colors" inline background-color="rgba(0, 0, 0, 0)" swatch-size="40" 
                :wrapper-style="{ paddingTop: '0px', paddingBottom: '0px', paddingLeft: '0px', height: '30px' }">
      </swatches>
    </div>
    <!-- WHITEBOARD -->
    <canvas id="myCanvas" :height="height"></canvas>
  </div>
</template>

<script>
export default {
  data() {
    return {
      color: 'red', 
      colors: ['yellow', 'green', 'red'],
      height: 700
    }
  },
  mounted() {
      this.canvas = document.getElementById('myCanvas')
      this.interval = setInterval(() => {
      const navbar = document.getElementById('whiteboard-toolbar')
      let navbarHeight = 0 
      if (navbar) {
        navbarHeight = navbar.scrollHeight
      }
      if (this.oldNavbarHeight != navbarHeight || this.oldWindowHeight != window.innerHeight) {
        this.canvas.setAttribute('height', `${window.innerHeight - navbarHeight - 10}`)
        this.rescaleCanvas()
        this.oldNavbarHeight = navbarHeight 
        this.oldWindowHeight = window.innerHeight
      }
    }, 1000)
  },
  methods: {
     rescaleCanvas() {
      // only redraw when the user has finished resizing the window
      // then, make the drawing coordinate system 1:1 with the actual size of the canvas
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      clearTimeout(this.redrawTimeout) // rescaleCanvas() called again during the 400 milliseconds, so cancel 
      this.redrawTimeout = setTimeout(this.drawStrokesInstantly(), 400) // resizing the canvas causes all drawings to be lost 
    },
    drawStrokesInstantly() {
      for (const stroke of this.allStrokes) {
        this.drawStroke(stroke, null)
      }
    },
    async drawStroke({ points, color, lineWidth }, pointPeriod = 0) {
      return new Promise(async resolve => {
        this.setStyle(color, lineWidth)
        for (const point of points) {
          const x = point.unitX * this.canvas.width
          const y = point.unitY * this.canvas.height
          this.drawToPoint(x, y)
          if (pointPeriod != null) {
            await new Promise(resolve => setTimeout(resolve, pointPeriod)) 
          }
        }
        this.lastX = -1
        resolve()
      })  
    },
    drawToPoint(x, y) {
      if (this.lastX == -1) {
        this.lastX = x
        this.lastY = y
        return
      }
      this.traceLineTo(x, y)
      this.ctx.stroke() 
      // update position
      this.lastX = x
      this.lastY = y
    },
    setStyle(color = 'yellow', lineWidth = 2) {
      this.ctx.strokeStyle = color
      this.ctx.lineCap = 'round' // lines at different angles can join into each other
      this.ctx.lineWidth = lineWidth
    },
    traceLineTo(x, y) {
      this.ctx.beginPath()
      this.ctx.moveTo(this.lastX, this.lastY)
      this.ctx.lineTo(x,y)
    }
  }
}
</script>