import { jsPDF } from 'jspdf';

/**
 * Render function type for PDF export
 * Renders a page to canvas at specified DPI
 */
export type PageRenderFunction = (pageIndex: number, dpi: number) => Promise<HTMLCanvasElement>;

/**
 * Export canvas pages as PDF using custom render function
 * Each page becomes a separate PDF page at specified DPI
 */
export async function exportToPDF(
  pageCount: number,
  paperWidthCm: number,
  paperHeightCm: number,
  renderPage: PageRenderFunction,
  dpi: number = 300
): Promise<Blob> {
  const pdf = new jsPDF({
    orientation: paperWidthCm > paperHeightCm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: [paperWidthCm * 10, paperHeightCm * 10], // Convert cm to mm
    compress: true,
  });

  const pageWidthMm = paperWidthCm * 10;
  const pageHeightMm = paperHeightCm * 10;

  for (let i = 0; i < pageCount; i++) {
    if (i > 0) {
      pdf.addPage([pageWidthMm, pageHeightMm], paperWidthCm > paperHeightCm ? 'landscape' : 'portrait');
    }

    // Render page to canvas using provided render function
    const canvas = await renderPage(i, dpi);
    
    const imgData = canvas.toDataURL('image/png', 1.0);
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidthMm, pageHeightMm);
  }

  return pdf.output('blob');
}

/**
 * Download PDF blob
 */
export function downloadPDF(blob: Blob, filename: string = `printa4-${Date.now()}.pdf`): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}