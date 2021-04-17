import { jsPDF } from "jspdf"; 

export default {
  props:{
    willDownloadPDF: {
      type: Boolean,
      required: true
    }
  },
  watch:{
    willDownloadPDF () {
      if (this.canvas) {
        this.returnCanvasPDF(this.canvas);
      }
    }
  },
  methods: {
    returnCanvasPDF(canvas) {
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const width = canvas.width;
      const height = canvas.height;
      let pdf = new jsPDF("p","pt", [width, height]); // specify custom page size
      pdf.addImage(imgData, "JPEG", 0, 0, width, height); // make sure to get full image
      pdf.save("download.pdf"); // could be changed to user-specified
    }
  }
}