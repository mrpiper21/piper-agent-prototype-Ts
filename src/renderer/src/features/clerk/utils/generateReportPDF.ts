import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import type { PrintJob } from '../../users/api/dashboardApi';

// Initialize pdfMake with fonts
const pdfFontsModule = pdfFonts as any;
if (pdfFontsModule.pdfMake && pdfFontsModule.pdfMake.vfs) {
  (pdfMake as any).vfs = pdfFontsModule.pdfMake.vfs;
} else if (pdfFontsModule.vfs) {
  (pdfMake as any).vfs = pdfFontsModule.vfs;
}


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
      tableData.push([
        `${tableData.length + 1}.`,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
      ]);
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
      pageMargins: [15, 15, 15, 15],
      // Use default fonts - pdfmake will use built-in fonts if none are specified
      content: [
        // Header
        {
          columns: [
            {
              text: 'LEX PRINT SERVICES',
              fontSize: 16,
              bold: true,
              width: '*',
            },
            {
              text: 'JOB ORDER FORM',
              fontSize: 14,
              bold: true,
              alignment: 'right',
              width: '*',
            },
          ],
          margin: [0, 0, 0, 10],
        },
        // Date and Details
        {
          text: `Date: ${data.date}`,
          fontSize: 10,
          margin: [0, 0, 0, 6],
        },
        {
          columns: [
            {
              text: data.companyName ? `COMPANY: ${data.companyName}` : 'COMPANY:',
              fontSize: 10,
              width: '*',
            },
          ],
          margin: [0, 0, 0, 6],
        },
        {
          text: `Job order no.: ${data.jobOrderNo || 'N/A'}`,
          fontSize: 10,
          margin: [0, 0, 0, 6],
        },
        {
          text: `Material: ${data.material || 'Flexi'}`,
          fontSize: 10,
          margin: [0, 0, 0, 6],
        },
        {
          text: `Client: ${data.clientName || 'N/A'}`,
          fontSize: 10,
          margin: [0, 0, 0, 10],
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
              ...tableData.map(row => row.map(cell => ({ text: cell || '', fontSize: 8 }))),
            ],
          },
          layout: {
            hLineWidth: function (i: number, node: unknown) {
              const tableNode = node as { table?: { body?: unknown[] } };
              return i === 0 || (tableNode.table?.body && i === tableNode.table.body.length) ? 1 : 0.5;
            },
            vLineWidth: function (_i: number) {
              return 0.5;
            },
            hLineColor: function (_i: number) {
              return '#000000';
            },
            vLineColor: function () {
              return '#000000';
            },
            paddingLeft: function () {
              return 2;
            },
            paddingRight: function () {
              return 2;
            },
            paddingTop: function () {
              return 2;
            },
            paddingBottom: function () {
              return 2;
            },
          },
          margin: [0, 0, 0, 10],
        },
        // Total Amount
        ...(totalAmount > 0
          ? [
              {
                text: totalAmount.toString(),
                fontSize: 10,
                bold: true,
                alignment: 'right',
                margin: [0, 10, 0, 0],
              },
            ]
          : []),
        // Footer - Signature areas
        {
          columns: [
            {
              stack: [
                {
                  text: 'Prepared by:',
                  fontSize: 10,
                  margin: [0, 0, 0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 100,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                  margin: [0, 0, 0, 10],
                },
                {
                  text: 'Printed by:',
                  fontSize: 10,
                  margin: [0, 0, 0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 100,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                },
              ],
              width: '*',
            },
            {
              stack: [
                {
                  text: 'Approved by:',
                  fontSize: 10,
                  margin: [0, 0, 0, 2],
                },
                {
                  canvas: [
                    {
                      type: 'line',
                      x1: 0,
                      y1: 0,
                      x2: 100,
                      y2: 0,
                      lineWidth: 0.5,
                    },
                  ],
                },
              ],
              alignment: 'right',
              width: '*',
            },
          ],
          margin: [0, 25, 0, 0],
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
    const fileName = `Job_Order_${data.date.replace(/ - /g, '_').replace(/ /g, '_')}_${data.jobOrderNo || 'report'}.pdf`;
    console.log('Generating PDF with filename:', fileName);
    
    pdfMake.createPdf(docDefinition as any).download(fileName);
    
    console.log('PDF generated and download initiated successfully');
  } catch (error) {
    console.error('Error in generateJobOrderPDF:', error);
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
