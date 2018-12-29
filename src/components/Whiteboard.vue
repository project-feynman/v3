<template>
  <!-- http://www.ckollars.org/canvas-two-coordinate-scales.html#scaling -->
  <!-- https://zipso.net/a-simple-touchscreen-sketchpad-using-javascript-and-html5/ -->
  <div class="whiteboard">
    <canvas id="myCanvas" width="1500" height="1500"></canvas>
  </div>
</template>

<style>
#myCanvas {
  width: 100%;
  background-color: rgb(192, 230, 253);
  cursor: crosshair;
  /* position: fixed; */
}
</style>

<script>
export default {
  data() {
    return {
      canvas: null,
      ctx: null,
      mouseX: null,
      mouseY: null,
      mouseDown: 0,
      touchX: null,
      touchY: null,
      lastX: -1,
      lastY: -1
    }
  },
  mounted() {
    // listen to Navbar's "clear whiteboard" button
    this.$root.$on('clear-whiteboard', this.clearCanvas)
    this.canvas = document.getElementById('myCanvas')
    this.ctx = this.canvas.getContext('2d')
    this.rescaleCanvas()
    window.addEventListener('resize', this.rescaleCanvas, false)
    this.initTouchEvents()
  },
  methods: {
    rescaleCanvas() {
      // console.log('INITIALLY')
      // console.log('model width and height =', this.canvas.width, this.canvas.height)
      // console.log('display width and height =', this.canvas.scrollWidth, this.canvas.scrollHeight)
      this.canvas.width = this.canvas.scrollWidth
      this.canvas.height = this.canvas.scrollHeight
      // console.log('AFTERWARDS')
      // console.log('model width and height =', this.canvas.width, this.canvas.height)
      // console.log('display width and height =', this.canvas.scrollWidth, this.canvas.scrollHeight)
    },
    initTouchEvents() {
      this.canvas.addEventListener('touchstart', this.touchStart, false)
      this.canvas.addEventListener('touchend',this.touchEnd, false)
      this.canvas.addEventListener('touchmove', this.touchMove, false)
    },
    initMouseEvents() {

    },
    clearCanvas() {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    drawLine(x, y, size) {
        // If lastX is not set, set lastX and lastY to the current position 
        if (this.lastX == -1) {
          this.lastX = x
	        this.lastY = y
        }
        
        // Select a fill style
        this.ctx.strokeStyle = 'black'

        // Set the line "cap" style to round, so lines at different angles can join into each other
        this.ctx.lineCap = "round";
        //ctx.lineJoin = "round";

        // Draw a filled line
        this.ctx.beginPath();

        //console.log('last position =', this.lastX, this.lastY)
        this.ctx.moveTo(this.lastX, this.lastY)
        this.ctx.lineTo(x,y)
        //console.log('new position =', x, y)

        // Set the line thickness and draw the line
        this.ctx.lineWidth = size
        this.ctx.stroke()

        this.ctx.closePath();

        // Update the last position to reference the current position
        this.lastX = x
        this.lastY = y
    },
    touchStart(e) {
      this.getTouchPos(e) 
      this.drawLine(this.touchX, this.touchY, 3)
    },
    touchMove(e) {
      this.getTouchPos(e)
      this.drawLine(this.touchX, this.touchY, 3)
      e.preventDefault()
    },
    touchEnd(e) {
      this.lastX = -1
      this.lastY = -1 
    },
    getTouchPos(e) {
      // Get the touch position relative to the top-left of the canvas
      // When we get the raw values of pageX and pageY below, they take into account the scrolling on the page
      // but not the position relative to our target div. We'll adjust them using "target.offsetLeft" and
      // "target.offsetTop" to get the correct values in relation to the top left of the canvas.
      if (e.touches) {
        if (e.touches.length == 1) { // Only deal with one finger
          const touch = e.touches[0]; // Get the information for finger #1
          this.touchX = touch.pageX - this.canvas.getBoundingClientRect().left
          this.touchY = touch.pageY - this.canvas.getBoundingClientRect().top
          // this.touchX = touch.pageX - touch.target.offsetLeft
          // this.touchY = touch.pageY - touch.target.offsetTop
        }
      }
    }
  }
}

//     // Keep track of the mouse button being pressed and draw a dot at current location
//     function sketchpad_mouseDown() {
//         mouseDown=1;
//         drawLine(ctx,mouseX,mouseY,12);
//     }

//     // Keep track of the mouse button being released
//     function sketchpad_mouseUp() {
//         mouseDown=0;

//         // Reset lastX and lastY to -1 to indicate that they are now invalid, since we have lifted the "pen"
//         lastX=-1;
//         lastY=-1;
//     }

//     // Keep track of the mouse position and draw a dot if mouse button is currently pressed
//     function sketchpad_mouseMove(e) { 
//         // Update the mouse co-ordinates when moved
//         getMousePos(e);

//         // Draw a dot if the mouse button is currently being pressed
//         if (mouseDown==1) {
//             drawLine(ctx,mouseX,mouseY,12);
//         }
//     }

//     // Get the current mouse position relative to the top-left of the canvas
//     function getMousePos(e) {
//         if (!e)
//             var e = event;

//         if (e.offsetX) {
//             mouseX = e.offsetX;
//             mouseY = e.offsetY;
//         }
//         else if (e.layerX) {
//             mouseX = e.layerX;
//             mouseY = e.layerY;
//         }
//      }



//     function sketchpad_touchEnd() {
//         // Reset lastX and lastY to -1 to indicate that they are now invalid, since we have lifted the "pen"
//         lastX=-1;
//         lastY=-1;
//     }

//     // Draw something and prevent the default scrolling when touch movement is detected
//     function sketchpad_touchMove(e) { 
//         // Update the touch co-ordinates
//         getTouchPos(e);

//         // During a touchmove event, unlike a mousemove event, we don't need to check if the touch is engaged, since there will always be contact with the screen by definition.
//         drawLine(ctx,touchX,touchY,12); 

//         // Prevent a scrolling action as a result of this touchmove triggering.
//         event.preventDefault();
//     }




//     // Set-up the canvas and add our event handlers after the page has loaded
//     function init() {
//         // Get the specific canvas element from the HTML document
//         canvas = document.getElementById('sketchpad');

//         // If the browser supports the canvas tag, get the 2d drawing context for this canvas
//         if (canvas.getContext)
//             ctx = canvas.getContext('2d');

//         // Check that we have a valid context to draw on/with before adding event handlers
//         if (ctx) {
//             // React to mouse events on the canvas, and mouseup on the entire document
//             canvas.addEventListener('mousedown', sketchpad_mouseDown, false);
//             canvas.addEventListener('mousemove', sketchpad_mouseMove, false);
//             window.addEventListener('mouseup', sketchpad_mouseUp, false);

//             // React to touch events on the canvas
//             canvas.addEventListener('touchstart', sketchpad_touchStart, false);
//             canvas.addEventListener('touchend', sketchpad_touchEnd, false);
//             canvas.addEventListener('touchmove', sketchpad_touchMove, false);
//         }
//     }
// </script>

</script>