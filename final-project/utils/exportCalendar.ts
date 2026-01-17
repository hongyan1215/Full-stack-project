/**
 * Export calendar as image using html2canvas
 * Note: html2canvas needs to be installed as a dependency
 */

export async function exportCalendarAsImage(elementId: string, filename: string = 'calendar.png'): Promise<void> {
  // Dynamic import to avoid SSR issues
  let html2canvas;
  try {
    html2canvas = (await import('html2canvas')).default;
  } catch (error) {
    throw new Error('html2canvas 未安裝。請執行: yarn add html2canvas 或 npm install html2canvas');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary') || '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    });

    // Convert canvas to blob and download
    canvas.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob from canvas');
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error('Error exporting calendar as image:', error);
    throw error;
  }
}

/**
 * Export calendar as PDF
 * Uses html2canvas to convert to image first, then jsPDF to create PDF
 */
export async function exportCalendarAsPDF(elementId: string, filename: string = 'calendar.pdf'): Promise<void> {
  // Dynamic import to avoid SSR issues
  let html2canvas, jsPDF;
  try {
    html2canvas = (await import('html2canvas')).default;
  } catch (error) {
    throw new Error('html2canvas 未安裝。請執行: yarn add html2canvas 或 npm install html2canvas');
  }
  
  try {
    const jspdfModule = await import('jspdf');
    jsPDF = jspdfModule.jsPDF;
  } catch (error) {
    throw new Error('jspdf 未安裝。請執行: yarn add jspdf 或 npm install jspdf');
  }

  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id "${elementId}" not found`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg-primary') || '#ffffff',
      scale: 2, // Higher quality
      useCORS: true,
      logging: false,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new (jsPDF as any)({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error('Error exporting calendar as PDF:', error);
    throw error;
  }
}

