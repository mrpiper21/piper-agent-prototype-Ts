import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { PrintJob } from '../../users/api/dashboardApi';

// Initialize pdfMake fonts - pdfmake expects pdfMake.vfs to be set
// Since we can't mutate ES module imports, we use a workaround:
// Create a local copy and set vfs on that
const fontsModule = pdfFonts as any;
const vfs = fontsModule.pdfMake?.vfs || fontsModule.vfs || {};

// Create a copy of pdfMake functions and assign vfs
const pdfMakeWithFonts = { ...pdfMake, vfs };

interface ReportData {
  date: string;
  jobs: PrintJob[];
  companyName?: string;
  clientName?: string;
  material?: string;
  jobOrderNo?: string;
}

export function generateJobOrderPDF(data: ReportData): void {
  try {
    console.log('PDF Generation started with data:', {
      date: data.date,
      jobCount: data.jobs.length,
      jobOrderNo: data.jobOrderNo,
    });

    // Table Data Preparation
    const tableData: string[][] = data.jobs.map((job, index): string[] => {
      const jobAny = job as unknown as Record<string, unknown>;
      const artwork = String(job.fileName || jobAny.name || 'N/A');
      const metadata = job.metadata as Record<string, unknown> | undefined;
      const size = String(metadata?.paperSize || metadata?.size || '');
      const ps = String(job.printJobId || '');
      const qty = String((metadata?.copies as number) || (jobAny.copies as number) || 1);
      const location = String(job.printerName || '');
      const rate = String((metadata?.rate as string) || '');
      const amount = String((metadata?.amount as string) || (metadata?.amt as string) || '');

      return [
        `${index + 1}.`,
        artwork,
        size,
        ps,
        qty,
        '', // SIZE OF MAT. USED - empty for now
        '', // SIZE OF MAT. LEFT - empty for now
        location,
        rate,
        amount,
        '', // TOTAL - empty for now
      ];
    });

    // Fill remaining rows up to 5 total rows
    while (tableData.length < 5) {
      tableData.push([`${tableData.length + 1}.`, '', '', '', '', '', '', '', '', '', '']);
    }

    // Calculate total amount
    const totalAmount = data.jobs.reduce((sum, job) => {
      const metadata = job.metadata as Record<string, unknown> | undefined;
      const amountStr = (metadata?.amount as string) || (metadata?.amt as string) || '0';
      const amount = parseFloat(amountStr);
      return sum + (isNaN(amount) ? 0 : amount);
    }, 0);

    // PDF Document Definition
    const docDefinition = {
      pageSize: 'A4',
      pageOrientation: 'portrait',
      pageMargins: [15, 20, 15, 15],
      // Use default fonts - pdfmake will use built-in fonts if none are specified
      content: [
        // Simple Header - Single line
        {
          text: 'LEX PRINT SERVICES',
          fontSize: 14,
          bold: true,
          margin: [0, 0, 0, 5],
        },
        {
          text: 'JOB ORDER FORM',
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 15],
        },
        // Date and Details - Simple list format
        {
          text: `Date: ${data.date}`,
          fontSize: 9,
          margin: [0, 0, 0, 4],
        },
        {
          text: data.companyName ? `COMPANY: ${data.companyName}` : 'COMPANY:',
          fontSize: 9,
          margin: [0, 0, 0, 4],
        },
        {
          text: `Job order no.: ${data.jobOrderNo || 'N/A'}`,
          fontSize: 9,
          margin: [0, 0, 0, 4],
        },
        {
          text: `Material: ${data.material || 'Flexi'}`,
          fontSize: 9,
          margin: [0, 0, 0, 4],
        },
        {
          text: `Client: ${data.clientName || 'N/A'}`,
          fontSize: 9,
          margin: [0, 0, 0, 12],
        },
        // Table
        {
          table: {
            headerRows: 1,
            widths: [12, 35, 20, 20, 15, 25, 25, 30, 20, 20, 20],
            body: [
              // Header row
              [
                { text: 's/n', style: 'tableHeader', fontSize: 8 },
                { text: 'ARTWORK', style: 'tableHeader', fontSize: 8 },
                { text: 'SIZE', style: 'tableHeader', fontSize: 8 },
                { text: 'PS', style: 'tableHeader', fontSize: 8 },
                { text: 'QTY', style: 'tableHeader', fontSize: 8 },
                { text: 'SIZE OF MAT. USED', style: 'tableHeader', fontSize: 8 },
                { text: 'SIZE OF MAT. LEFT', style: 'tableHeader', fontSize: 8 },
                { text: 'LOCATION/VENDOR', style: 'tableHeader', fontSize: 8 },
                { text: 'RATE', style: 'tableHeader', fontSize: 8 },
                { text: 'AMT GHC', style: 'tableHeader', fontSize: 8 },
                { text: 'TOTAL', style: 'tableHeader', fontSize: 8 },
              ],
              // Data rows
              ...tableData.map((row) => row.map((cell) => ({ text: cell || '', fontSize: 8 }))),
            ],
          },
          layout: {
            // Simple grid layout - all lines same width
            hLineWidth: function () {
              return 0.5;
            },
            vLineWidth: function () {
              return 0.5;
            },
            hLineColor: function () {
              return '#000000';
            },
            vLineColor: function () {
              return '#000000';
            },
            paddingLeft: function () {
              return 3;
            },
            paddingRight: function () {
              return 3;
            },
            paddingTop: function () {
              return 3;
            },
            paddingBottom: function () {
              return 3;
            },
          },
          margin: [0, 0, 0, 10],
        },
        // Total Amount (if any)
        ...(totalAmount > 0
          ? [
              {
                text: `Total: ${totalAmount.toString()}`,
                fontSize: 9,
                bold: true,
                alignment: 'right',
                margin: [0, 8, 0, 0],
              },
            ]
          : []),
        // Footer - Signature areas (simple format)
        {
          margin: [0, 30, 0, 0],
          columns: [
            {
              text: 'Prepared by: _____________\n\nPrinted by: _____________',
              fontSize: 9,
              width: '*',
            },
            {
              text: 'Approved by: _____________',
              fontSize: 9,
              alignment: 'right',
              width: '*',
            },
          ],
        },
      ],
      styles: {
        tableHeader: {
          bold: true,
          fontSize: 8,
          color: '#000000',
          fillColor: '#ffffff',
        },
      },
      // Don't specify font - pdfmake will use its built-in defaults
    };

    // Generate and download PDF
    const fileName = `Job_Order_${data.date.replace(/ - /g, '_').replace(/ /g, '_')}_${
      data.jobOrderNo || 'report'
    }.pdf`;
    console.log('Generating PDF with filename:', fileName);

    // Create PDF with fonts - use pdfMakeWithFonts which has vfs set
    const pdfDoc = pdfMakeWithFonts.createPdf(docDefinition as any);
    pdfDoc.download(fileName);

    console.log('PDF generated and download initiated successfully');
  } catch (error) {
    console.error('Error in generateJobOrderPDF:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
