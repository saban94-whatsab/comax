import { jsPDF } from 'jspdf';
import { DocumentScan } from '../types';

/**
 * Generates a clean A4 PDF file containing the processed scan image and header metadata.
 */
export async function generateDocumentPdf(scan: DocumentScan): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create A4 PDF (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;

      // Header background
      pdf.setFillColor(243, 244, 246);
      pdf.rect(margin, margin, pageWidth - margin * 2, 28, 'F');
      pdf.setDrawColor(209, 213, 219);
      pdf.rect(margin, margin, pageWidth - margin * 2, 28, 'S');

      // Title & Order Info
      pdf.setFontSize(16);
      pdf.setTextColor(30, 41, 59);
      pdf.text(`DELIVERY NOTE / תעודת משלוח: ${scan.orderNumber}`, margin + 5, margin + 10);

      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      const driverStr = `Driver / נהג: ${scan.driverName}`;
      const dateStr = `Date / תאריך: ${new Date(scan.timestamp).toLocaleString('he-IL')}`;
      const clientStr = scan.clientName ? `Client / לקוח: ${scan.clientName}` : '';

      pdf.text(driverStr, margin + 5, margin + 18);
      pdf.text(dateStr, margin + 5, margin + 24);
      if (clientStr) {
        pdf.text(clientStr, margin + 100, margin + 18);
      }

      // Add image to PDF
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const imgRatio = img.width / img.height;

          // Available area for image
          const startY = margin + 32;
          const maxW = pageWidth - margin * 2;
          const maxH = pageHeight - startY - margin;

          let renderW = maxW;
          let renderH = renderW / imgRatio;

          if (renderH > maxH) {
            renderH = maxH;
            renderW = renderH * imgRatio;
          }

          const startX = margin + (maxW - renderW) / 2;

          pdf.addImage(
            scan.processedImageBase64,
            'JPEG',
            startX,
            startY,
            renderW,
            renderH,
            undefined,
            'FAST'
          );

          // Footer
          pdf.setFontSize(8);
          pdf.setTextColor(148, 163, 184);
          pdf.text(
            `Scanned via Driver Delivery App | ID: ${scan.id}`,
            margin,
            pageHeight - 4
          );

          const pdfOutput = pdf.output('datauristring');
          resolve(pdfOutput);
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = scan.processedImageBase64;
    } catch (err) {
      reject(err);
    }
  });
}
