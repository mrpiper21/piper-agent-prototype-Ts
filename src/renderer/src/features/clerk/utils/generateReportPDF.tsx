import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from '@react-pdf/renderer';
import type { PrintJob } from '../../users/api/dashboardApi';

// Register fonts (optional - using default fonts for now)
// You can add custom fonts later if needed

interface ReportData {
  date: string;
  jobs: PrintJob[];
  companyName?: string;
  businessName?: string;
  clientName?: string;
  material?: string;
  jobOrderNo?: string;
  businessInfo?: {
    businessName?: string;
    businessPhone?: string;
    location?: { latitude: number; longitude: number; address: string };
    email?: string;
    name?: string;
  };
  categoryBreakdown?: Array<{ categoryName: string; count: number; revenue: number }>;
  summary?: {
    totalJobs: number;
    completedJobs: number;
    pendingJobs: number;
    failedJobs: number;
    totalRevenue: number;
    pendingRevenue: number;
  };
}

// PDF Document Component
const JobOrderDocument: React.FC<ReportData> = ({
  date,
  jobs,
  companyName,
  businessName,
  clientName,
  material,
  jobOrderNo,
  businessInfo,
  categoryBreakdown,
  summary,
}) => {
  // Use businessName from businessInfo or prop, fallback to companyName
  const displayBusinessName = businessInfo?.businessName || businessName || companyName || 'Business Name';

  // Calculate total amount from jobs or use summary
  const totalAmount = summary?.totalRevenue || jobs.reduce((sum: number, job) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const metadata = job.metadata as Record<string, unknown> | undefined;
    const amountStr = (metadata?.amount as string) || (metadata?.amt as string) || (jobAny.amount as string) || (jobAny.totalPrice as string) || '0';
    const amount = parseFloat(amountStr);
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  // Prepare table rows
  const tableRows = jobs.map((job, index) => {
    const jobAny = job as unknown as Record<string, unknown>;
    
    // Extract artwork name - prefer artwork field, then fileName, then originalName
    const artwork = String(
      (jobAny.artwork as string) ||
      (jobAny.fileName as string) ||
      (jobAny.originalName as string) ||
      ((jobAny as { clientId?: { fullName?: string } }).clientId?.fullName as string) || 
      'N/A'
    );
    
    // Extract category name
    const categoryName = String(
      ((jobAny as { categoryId?: { name?: string } }).categoryId?.name as string) ||
      'N/A'
    );
    
    // Extract size - direct field or from metadata
    const size = String(
      (jobAny.size as string) || 
      (job.metadata as Record<string, unknown> | undefined)?.size || 
      (jobAny.width && jobAny.height ? `${jobAny.width} x ${jobAny.height}` : '') ||
      'N/A'
    );
    
    // Extract print job ID - prefer printJobId, then _id, then id
    const ps = "#"+ String(
      (jobAny.printJobId as string) ||
      ((jobAny as { _id: string })._id?.slice(0, 8) as string) || 
      job.id || 
      ''
    );
    
    // Extract quantity
    const qty = String(
      (jobAny.quantity as number) || 
      (jobAny.copies as number) || 
      (job.metadata as Record<string, unknown> | undefined)?.copies || 
      1
    );
    
    // Extract location
    const location = String(
      (jobAny.location as string) || 
      job.printerName || 
      ''
    );
    
    // Extract rate and amount from metadata or direct fields
    const metadata = job.metadata as Record<string, unknown> | undefined;
    const rate = String(
      (metadata?.rate as string) || 
      (jobAny.rate as string) ||
      ((jobAny as { categoryId?: { unitPrice?: number } }).categoryId?.unitPrice as number)?.toFixed(2) ||
      'N/A'
    );
    const amount = String(
      (jobAny.totalPrice as number)?.toFixed(2) ||
      (metadata?.amount as string) || 
      (metadata?.amt as string) || 
      (jobAny.amount as string) || 
      'N/A'
    );

    // Extract payment status
    const paymentStatus = String(
      (jobAny.paymentStatus as string) || 'pending'
    );

    return {
      sn: `${index + 1}.`,
      artwork,
      category: categoryName,
      size,
      ps,
      qty,
      matUsed: '',
      matLeft: '',
      location,
      rate,
      amount,
      paymentStatus,
      total: '',
    };
  });

  // Fill remaining rows up to 5 total rows
  while (tableRows.length < 5) {
    tableRows.push({
      sn: `${tableRows.length + 1}.`,
      artwork: '',
      category: '',
      size: '',
      ps: '',
      qty: '',
      matUsed: '',
      matLeft: '',
      location: '',
      rate: '',
      amount: '',
      paymentStatus: '',
      total: '',
    });
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{displayBusinessName.toUpperCase()}</Text>
          {businessInfo?.businessPhone && (
            <Text style={styles.businessInfo}>Phone: {businessInfo.businessPhone}</Text>
          )}
          {businessInfo?.email && (
            <Text style={styles.businessInfo}>Email: {businessInfo.email}</Text>
          )}
          {businessInfo?.location?.address && (
            <Text style={styles.businessInfo}>Address: {businessInfo.location.address}</Text>
          )}
        </View>

        {/* Information Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date:</Text>
            <Text style={styles.infoValue}>{date}</Text>
          </View>
          {summary && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total Jobs:</Text>
                <Text style={styles.infoValue}>{summary.totalJobs}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Completed:</Text>
                <Text style={styles.infoValue}>{summary.completedJobs}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Pending:</Text>
                <Text style={styles.infoValue}>{summary.pendingJobs}</Text>
              </View>
            </>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Job Order No.:</Text>
            <Text style={styles.infoValue}>{jobOrderNo || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Material:</Text>
            <Text style={styles.infoValue}>{material || 'Flexi'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Client:</Text>
            <Text style={styles.infoValue}>
              {clientName || 
               (jobs.length > 0 && (jobs[0] as unknown as Record<string, unknown>).clientId 
                 ? ((jobs[0] as unknown as Record<string, unknown>).clientId as Record<string, unknown>)?.fullName as string || 'N/A'
                 : 'N/A')}
            </Text>
          </View>
        </View>

        {/* Table Section */}
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>S/N</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.5 }]}>ARTWORK</Text>
            <Text style={[styles.tableCellHeader, { flex: 1 }]}>CATEGORY</Text>
            <Text style={[styles.tableCellHeader, { flex: 1 }]}>SIZE</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.7 }]}>QTY</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>LOCATION</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>RATE</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>AMT GHC</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>PAYMENT</Text>
          </View>

          {/* Table Rows */}
          {tableRows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCellData, { flex: 0.5 }]}>{row.sn}</Text>
              <Text style={[styles.tableCellData, { flex: 1.5 }]}>{row.artwork}</Text>
              <Text style={[styles.tableCellData, { flex: 1 }]}>{row.category}</Text>
              <Text style={[styles.tableCellData, { flex: 1 }]}>{row.size}</Text>
              <Text style={[styles.tableCellData, { flex: 0.7 }]}>{row.qty}</Text>
              <Text style={[styles.tableCellData, { flex: 1.2 }]}>{row.location}</Text>
              <Text style={[styles.tableCellData, { flex: 0.8 }]}>{row.rate}</Text>
              <Text style={[styles.tableCellData, { flex: 0.8 }]}>{row.amount}</Text>
              <Text style={[styles.tableCellData, { flex: 0.8, textTransform: 'uppercase' }]}>{row.paymentStatus}</Text>
            </View>
          ))}
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown && categoryBreakdown.length > 0 && (
          <View style={styles.categorySection}>
            <Text style={styles.sectionTitle}>Category Breakdown</Text>
            {categoryBreakdown.map((cat, index) => (
              <View key={index} style={styles.categoryRow}>
                <Text style={styles.categoryName}>{cat.categoryName}:</Text>
                <Text style={styles.categoryValue}>
                  {cat.count} jobs - GHC {cat.revenue.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Total Section */}
        {totalAmount > 0 && (
          <View style={styles.totalSection}>
            <Text style={styles.totalText}>Total Revenue: GHC {totalAmount.toFixed(2)}</Text>
            {summary?.pendingRevenue && summary.pendingRevenue > 0 && (
              <Text style={styles.pendingText}>
                Pending Revenue: GHC {summary.pendingRevenue.toFixed(2)}
              </Text>
            )}
          </View>
        )}

        {/* Footer Section - Signatures */}
        <View style={styles.footer}>
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Prepared by:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>Printed by:</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureSection}>
            <Text style={styles.signatureLabel}>Approved by:</Text>
            <View style={styles.signatureLine} />
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'lightgray',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
    textAlign: 'center',
  },
  businessInfo: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'center',
    marginTop: 2,
  },
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  infoSection: {
    marginBottom: 20,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'center',
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 120,
    color: '#475569',
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    color: '#1e293b',
    fontSize: 9,
  },
  tableContainer: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    borderBottomWidth: 2,
    borderBottomColor: '#1e3a8a',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
    minHeight: 25,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: 'center',
  },
  tableCellHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tableCellData: {
    fontSize: 7,
    color: '#1e293b',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  totalSection: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  totalText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  pendingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 4,
  },
  categorySection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 9,
  },
  categoryName: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
  },
  categoryValue: {
    fontSize: 9,
    color: '#1e293b',
    fontWeight: '500',
  },
  footer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  signatureSection: {
    width: '45%',
  },
  signatureLabel: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: '#94a3b8',
    marginBottom: 15,
    height: 20,
  },
});

// Main export function
export async function generateJobOrderPDF(data: ReportData): Promise<void> {
  try {
    console.log('PDF Generation started with data:', {
      date: data.date,
      jobCount: data.jobs.length,
      jobOrderNo: data.jobOrderNo,
    });

    // Generate PDF blob
    const blob = await pdf(<JobOrderDocument {...data} />).toBlob();

    // Create download link
    const fileName = `Job_Order_${data.date.replace(/ - /g, '_').replace(/ /g, '_')}_${
      data.jobOrderNo || 'report'
    }.pdf`;

    // Create a temporary URL and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('PDF generated and download initiated successfully');
  } catch (error) {
    console.error('Error in generateJobOrderPDF:', error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

