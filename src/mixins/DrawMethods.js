export default {
  created() {
    console.log('hello from mixin!')
  },
  methods: {
    drawStroke(points) {
      console.log('drawStroke from mixin!')
      for (let i = 0; i < points.length; i++) {
        const x = points[i].unitX * this.canvas.width
        const y = points[i].unitY * this.canvas.height
        this.drawLine(x, y, 3)
        if (i == points.length - 1) {
          this.lastX = -1 
        }
      }
    },
    drawAllStrokes(strokes) {
      if (!strokes) {
        return 
      }
      for (let i = 0; i < strokes.length; i++) {
        this.drawStroke(strokes[i].points )
      }
    },
  }
}