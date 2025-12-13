import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import PptxGenJS from 'pptxgenjs';

/**
 * Export utilities for generating PDF and PowerPoint reports
 * from the Donation Pattern Analyzer dashboard
 */

/**
 * Export options configuration
 */
export const EXPORT_CONFIG = {
  pdf: {
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    margins: {
      top: 15,
      bottom: 15,
      left: 15,
      right: 15
    }
  },
  ppt: {
    layout: 'LAYOUT_WIDE',
    author: 'Donation Pattern Analyzer',
    company: '',
    subject: 'Donor Analytics Report',
    title: 'Donor Analytics Report'
  },
  colors: {
    primary: '#4F46E5',
    secondary: '#10B981',
    text: '#0F172A',
    muted: '#64748B',
    background: '#F8FAFC'
  }
};

/**
 * Captures a DOM element as a canvas image
 * @param {HTMLElement} element - The element to capture
 * @param {Object} options - html2canvas options
 * @returns {Promise<HTMLCanvasElement>}
 */
export const captureElement = async (element, options = {}) => {
  const defaultOptions = {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight
  };

  return html2canvas(element, { ...defaultOptions, ...options });
};

/**
 * Generates a PDF report from dashboard sections
 * @param {Object} options - Export options
 * @param {string} options.title - Report title
 * @param {string} options.subtitle - Report subtitle
 * @param {HTMLElement[]} options.sections - Array of DOM elements to include
 * @param {Object} options.metadata - Additional metadata
 * @returns {Promise<jsPDF>}
 */
export const exportToPDF = async ({
  title = 'Donor Analytics Report',
  subtitle = '',
  sections = [],
  metadata = {},
  filename = 'donor-analytics-report.pdf'
}) => {
  const pdf = new jsPDF({
    orientation: EXPORT_CONFIG.pdf.orientation,
    unit: EXPORT_CONFIG.pdf.unit,
    format: EXPORT_CONFIG.pdf.format
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const { margins } = EXPORT_CONFIG.pdf;

  // Add title page
  pdf.setFillColor(EXPORT_CONFIG.colors.primary);
  pdf.rect(0, 0, pageWidth, 50, 'F');

  pdf.setTextColor('#ffffff');
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margins.left, 30);

  if (subtitle) {
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(subtitle, margins.left, 40);
  }

  // Add metadata
  pdf.setTextColor(EXPORT_CONFIG.colors.text);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  pdf.text(`Generated: ${dateStr}`, margins.left, 65);

  if (metadata.organization) {
    pdf.text(`Organization: ${metadata.organization}`, margins.left, 72);
  }

  // Add sections
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (!section || !section.element) continue;

    pdf.addPage();

    // Section header
    pdf.setFillColor(EXPORT_CONFIG.colors.background);
    pdf.rect(0, 0, pageWidth, 20, 'F');

    pdf.setTextColor(EXPORT_CONFIG.colors.primary);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(section.title || `Section ${i + 1}`, margins.left, 14);

    // Capture and add section content
    try {
      const canvas = await captureElement(section.element);
      const imgData = canvas.toDataURL('image/png');

      const imgWidth = pageWidth - margins.left - margins.right;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const maxHeight = pageHeight - 30 - margins.bottom;

      // Scale down if too tall
      const finalHeight = Math.min(imgHeight, maxHeight);
      const finalWidth = (finalHeight === maxHeight)
        ? (canvas.width * maxHeight) / canvas.height
        : imgWidth;

      pdf.addImage(
        imgData,
        'PNG',
        margins.left,
        25,
        finalWidth,
        finalHeight
      );
    } catch (error) {
      console.error(`Error capturing section ${i}:`, error);
      pdf.setTextColor(EXPORT_CONFIG.colors.muted);
      pdf.setFontSize(12);
      pdf.text('Unable to render this section', margins.left, 40);
    }
  }

  // Add page numbers
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(EXPORT_CONFIG.colors.muted);
    pdf.setFontSize(8);
    pdf.text(
      `Page ${i} of ${totalPages}`,
      pageWidth - margins.right - 20,
      pageHeight - 8
    );
  }

  // Save the PDF
  pdf.save(filename);

  return pdf;
};

/**
 * Generates a PowerPoint presentation from dashboard sections
 * @param {Object} options - Export options
 * @returns {Promise<PptxGenJS>}
 */
export const exportToPPT = async ({
  title = 'Donor Analytics Report',
  subtitle = '',
  sections = [],
  metadata = {},
  filename = 'donor-analytics-report.pptx'
}) => {
  const pptx = new PptxGenJS();

  // Set presentation properties
  pptx.author = EXPORT_CONFIG.ppt.author;
  pptx.company = metadata.organization || EXPORT_CONFIG.ppt.company;
  pptx.subject = EXPORT_CONFIG.ppt.subject;
  pptx.title = title;
  pptx.layout = EXPORT_CONFIG.ppt.layout;

  // Title slide
  const titleSlide = pptx.addSlide();

  titleSlide.addShape('rect', {
    x: 0,
    y: 0,
    w: '100%',
    h: '40%',
    fill: { color: EXPORT_CONFIG.colors.primary.replace('#', '') }
  });

  titleSlide.addText(title, {
    x: 0.5,
    y: 1.2,
    w: '90%',
    h: 1,
    fontSize: 36,
    fontFace: 'Arial',
    bold: true,
    color: 'FFFFFF'
  });

  if (subtitle) {
    titleSlide.addText(subtitle, {
      x: 0.5,
      y: 2.0,
      w: '90%',
      h: 0.5,
      fontSize: 18,
      fontFace: 'Arial',
      color: 'FFFFFF'
    });
  }

  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  titleSlide.addText(`Generated: ${dateStr}`, {
    x: 0.5,
    y: 3.5,
    w: '90%',
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: EXPORT_CONFIG.colors.muted.replace('#', '')
  });

  // Content slides
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    if (!section || !section.element) continue;

    const slide = pptx.addSlide();

    // Section title
    slide.addText(section.title || `Section ${i + 1}`, {
      x: 0.5,
      y: 0.3,
      w: '90%',
      h: 0.6,
      fontSize: 24,
      fontFace: 'Arial',
      bold: true,
      color: EXPORT_CONFIG.colors.primary.replace('#', '')
    });

    // Capture and add section content
    try {
      const canvas = await captureElement(section.element);
      const imgData = canvas.toDataURL('image/png');

      // Calculate dimensions to fit slide
      const maxWidth = 12.5; // inches
      const maxHeight = 4.5; // inches
      const aspectRatio = canvas.width / canvas.height;

      let imgWidth = maxWidth;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      slide.addImage({
        data: imgData,
        x: (13.33 - imgWidth) / 2, // Center horizontally
        y: 1.1,
        w: imgWidth,
        h: imgHeight
      });
    } catch (error) {
      console.error(`Error capturing section ${i}:`, error);
      slide.addText('Unable to render this section', {
        x: 0.5,
        y: 2,
        w: '90%',
        h: 0.5,
        fontSize: 14,
        fontFace: 'Arial',
        color: EXPORT_CONFIG.colors.muted.replace('#', '')
      });
    }

    // Add slide number
    slide.addText(`${i + 2}`, {
      x: '95%',
      y: '95%',
      w: 0.3,
      h: 0.3,
      fontSize: 10,
      color: EXPORT_CONFIG.colors.muted.replace('#', '')
    });
  }

  // Save the presentation
  await pptx.writeFile({ fileName: filename });

  return pptx;
};

/**
 * Export a single chart element
 * @param {HTMLElement} chartElement - The chart canvas or container
 * @param {string} format - 'png' or 'jpeg'
 * @param {string} filename - Output filename
 */
export const exportChart = async (chartElement, format = 'png', filename = 'chart') => {
  const canvas = await captureElement(chartElement, { scale: 3 });
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = canvas.toDataURL(`image/${format}`);
  link.click();
};

/**
 * Export data as CSV
 * @param {Object[]} data - Array of objects to export
 * @param {string} filename - Output filename
 */
export const exportToCSV = (data, filename = 'data.csv') => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

/**
 * Export data as JSON
 * @param {Object} data - Data to export
 * @param {string} filename - Output filename
 */
export const exportToJSON = (data, filename = 'data.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default {
  exportToPDF,
  exportToPPT,
  exportChart,
  exportToCSV,
  exportToJSON,
  captureElement,
  EXPORT_CONFIG
};
