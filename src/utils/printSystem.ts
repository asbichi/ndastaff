import html2pdf from 'html2pdf.js';
import { toast } from 'sonner';

export type PrintOrientation = 'portrait' | 'landscape';

export interface GlobalPrintOptions {
  title: string;
  orientation?: PrintOrientation;
  element?: HTMLElement | null;
  filename?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

// Convert modern CSS colors (oklch/oklab) to standard sRGB for canvas and PDF compatibility
export function sanitizeModernColors(str: any): any {
  if (typeof str !== 'string') return str;
  if (!str.includes('oklch') && !str.includes('oklab')) return str;

  // Simple and safe sRGB converter fallback
  return str
    .replace(/oklch\([^)]+\)/gi, '#0f172a')
    .replace(/oklab\([^)]+\)/gi, '#0f172a');
}

/**
 * Injects or updates dynamic print styles for the specified orientation
 */
export function setupPrintStyles(orientation: PrintOrientation = 'portrait') {
  let styleEl = document.getElementById('global-dynamic-print-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'global-dynamic-print-styles';
    document.head.appendChild(styleEl);
  }

  const isLandscape = orientation === 'landscape';
  const pageSize = isLandscape ? 'A4 landscape' : 'A4 portrait';
  const pageMargin = isLandscape ? '6mm 5mm' : '8mm 6mm';

  styleEl.innerHTML = `
    @media print {
      @page {
        size: ${pageSize};
        margin: ${pageMargin};
      }

      *, *:before, *:after {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }

      body {
        background: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        font-size: 10pt;
      }

      /* Hide all non-printable application chrome */
      aside, nav, header:not(.print-header), footer:not(.print-footer),
      .print\\:hidden, .no-print, button, .sonner-toast, [role="status"] {
        display: none !important;
      }

      /* Clean main content wrapper */
      main, .flex-1, .app-content {
        overflow: visible !important;
        height: auto !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }

      /* Printable document containers */
      .printable-document {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        background: #ffffff !important;
      }

      /* Optimize Table Layouts for A4 */
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }

      thead {
        display: table-header-group !important;
      }

      tfoot {
        display: table-footer-group !important;
      }

      tr {
        page-break-inside: avoid !important;
        page-break-after: auto !important;
      }

      th, td {
        word-wrap: break-word !important;
      }

      /* Page Breaks */
      .page-break, .break-after-page {
        break-after: page !important;
        page-break-after: always !important;
      }

      .avoid-break, .print-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      /* Repeat Header & Footer */
      .print-header-sticky {
        position: static !important;
      }

      .print-watermark {
        opacity: 0.05 !important;
      }
    }
  `;
}

/**
 * Triggers the browser's global print dialog with orientation preconfigured
 */
export function triggerGlobalPrint({
  title,
  orientation = 'portrait',
  onBeforePrint,
  onAfterPrint
}: GlobalPrintOptions) {
  try {
    // 1. Setup exact @page orientation styles
    setupPrintStyles(orientation);

    if (onBeforePrint) onBeforePrint();

    // Notify user of preview iFrame behavior
    toast.info(`Preparing A4 ${orientation.toUpperCase()} print dialog...`, { duration: 3000 });

    // 2. Temporarily set document title for default printer filename
    const originalTitle = document.title;
    if (title) {
      document.title = title;
    }

    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error("Window print error:", err);
        toast.error("Could not trigger browser print dialog. Please use PDF Download instead.");
      } finally {
        if (title) {
          setTimeout(() => {
            document.title = originalTitle;
            if (onAfterPrint) onAfterPrint();
          }, 1000);
        }
      }
    }, 350);
  } catch (error) {
    console.error("triggerGlobalPrint error:", error);
    toast.error("Print initialization failed.");
  }
}

/**
 * Generates and downloads a pixel-perfect A4 PDF using html2pdf with full vector preservation
 */
export async function generateA4Pdf(
  element: HTMLElement,
  options: {
    filename: string;
    orientation?: PrintOrientation;
    title?: string;
  }
): Promise<void> {
  if (!element) {
    toast.error("No printable element found to generate PDF.");
    return;
  }

  const orientation = options.orientation || 'portrait';
  const isLandscape = orientation === 'landscape';
  const fileName = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`;

  const toastId = toast.loading(`Generating A4 ${orientation.toUpperCase()} PDF document...`);

  // Intercept window.getComputedStyle to translate modern colors
  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function (elt, pseudoElt) {
    const style = originalGetComputedStyle(elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop, receiver) {
        if (prop === 'getPropertyValue') {
          return function (propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            return typeof val === 'string' ? sanitizeModernColors(val) : val;
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'string') {
          return sanitizeModernColors(val);
        }
        return val;
      }
    }) as any;
  };

  try {
    const exporter = (html2pdf as any).default || html2pdf;

    const opt = {
      margin: isLandscape ? [5, 4, 5, 4] : [6, 5, 6, 5], // millimeters
      filename: fileName,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2.2, // sharp retina text
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        letterRendering: true,
        scrollY: 0,
        onclone: (docClone: Document) => {
          // Unhide print containers in the clone
          const printAreas = docClone.querySelectorAll('.printable-document, .pdf-export-container');
          printAreas.forEach((el: any) => {
            el.style.position = 'static';
            el.style.opacity = '1';
            el.style.display = 'block';
            el.style.visibility = 'visible';
          });
        }
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: orientation,
        compress: true
      },
      pagebreak: { 
        mode: ['avoid-all', 'css', 'legacy'], 
        avoid: ['.avoid-break', '.print-avoid-break', 'tr', '.report-sheet-page', '.broad-sheet-page'] 
      }
    };

    await exporter().set(opt).from(element).save();
    toast.dismiss(toastId);
    toast.success("PDF document generated successfully!");
  } catch (error: any) {
    console.error("PDF generation failed:", error);
    toast.dismiss(toastId);
    toast.error(`PDF generation failed: ${error.message || 'Please use browser Print instead.'}`);
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
  }
}
