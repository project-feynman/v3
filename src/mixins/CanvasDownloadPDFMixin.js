import { jsPDF } from "jspdf"; //used for canvas to PDF conversion

export default {
    props:{
        downloadPDF: {
            type: Boolean,
            required: true
          }
    },
    watch:{
        downloadPDF() {
            if(this.canvas){
              this.returnCanvasPDF(this.canvas);
            }
          }
    },
    methods: {
        returnCanvasPDF(canvas) {
            const imgData = canvas.toDataURL("image/jpeg", 1.0);
            const width = canvas.width;
            const height = canvas.height;
            var pdf = new jsPDF('p','pt',[width,height]); //specify custom page size
            pdf.addImage(imgData, 'JPEG', 0, 0, width, height); //make sure to get full image
            pdf.save("download.pdf"); //could be changed to user-specified
          },
    }
}