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

  // Prepare table rows with comprehensive data for both quotations and normal jobs
  const tableRows = jobs.map((job, index) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const isQuotation = (jobAny.isQuotation as boolean) === true;
    
    // Extract job type
    const jobType = isQuotation ? 'QUOTE' : 'JOB';
    
    // Extract description/artwork - for quotes use orderDescription, for jobs use artwork/fileName
    const description = String(
      isQuotation 
        ? ((jobAny.orderDescription as string) || 'Quote Request')
        : ((jobAny.artwork as string) ||
           (jobAny.fileName as string) ||
           (jobAny.originalName as string) ||
           ((jobAny as { clientId?: { fullName?: string } }).clientId?.fullName as string) || 
           'N/A')
    );
    
    // Extract category name
    const categoryName = String(
      ((jobAny as { categoryId?: { name?: string } }).categoryId?.name as string) ||
      'N/A'
    );
    
    // Extract size - for quotes show specifications, for jobs show size
    const size = String(
      isQuotation
        ? ((jobAny.specifications as string) || 'N/A')
        : ((jobAny.size as string) || 
           (job.metadata as Record<string, unknown> | undefined)?.size || 
           (jobAny.width && jobAny.height ? `${jobAny.width} x ${jobAny.height}` : '') ||
           'N/A')
    );
    
    // Extract print job ID - prefer printJobId, then _id, then id
    const jobId = "#"+ String(
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
    
    // Extract location/printer
    const location = String(
      (jobAny.location as string) || 
      job.printerName || 
      'N/A'
    );
    
    // Extract rate - for quotes calculate from totalPrice, for jobs use rate/unitPrice
    const metadata = job.metadata as Record<string, unknown> | undefined;
    const totalPrice = (jobAny.totalPrice as number) || 0;
    const quantity = (jobAny.quantity as number) || (jobAny.copies as number) || 1;
    const rate = String(
      isQuotation && totalPrice > 0 && quantity > 0
        ? (totalPrice / quantity).toFixed(2)
        : ((metadata?.rate as string) || 
           (jobAny.rate as string) ||
           ((jobAny as { categoryId?: { unitPrice?: number } }).categoryId?.unitPrice as number)?.toFixed(2) ||
           'N/A')
    );
    
    // Extract total amount
    const amount = String(
      totalPrice > 0 
        ? totalPrice.toFixed(2)
        : ((metadata?.amount as string) || 
           (metadata?.amt as string) || 
           (jobAny.amount as string) || 
           '0.00')
    );

    // Extract payment status
    const paymentStatus = String(
      (jobAny.paymentStatus as string) || (isQuotation ? 'pending' : 'N/A')
    );
    
    // Extract amount paid - only for paid jobs
    const amountPaid = String(
      paymentStatus === 'paid' && totalPrice > 0
        ? totalPrice.toFixed(2)
        : '0.00'
    );
    
    // Extract payment reference
    const paymentRef = String(
      (jobAny.paymentReference as string) || ''
    );

    return {
      sn: `${index + 1}.`,
      jobType,
      description,
      category: categoryName,
      size,
      jobId,
      qty,
      location,
      rate,
      amount,
      amountPaid,
      paymentStatus,
      paymentRef,
    };
  });

  // Calculate breakdown statistics
  const quotationJobs = jobs.filter((job) => (job as unknown as Record<string, unknown>).isQuotation === true);
  const normalJobs = jobs.filter((job) => (job as unknown as Record<string, unknown>).isQuotation !== true);
  
  const quotationTotal = quotationJobs.reduce((sum, job) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const totalPrice = (jobAny.totalPrice as number) || 0;
    return sum + totalPrice;
  }, 0);
  
  const normalJobsTotal = normalJobs.reduce((sum, job) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const totalPrice = (jobAny.totalPrice as number) || 0;
    const metadata = job.metadata as Record<string, unknown> | undefined;
    const amount = parseFloat(
      String(totalPrice || 
        (metadata?.amount as string) || 
        (metadata?.amt as string) || 
        (jobAny.amount as string) || 
        '0')
    );
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const paidAmount = jobs.reduce((sum, job) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const paymentStatus = String(jobAny.paymentStatus || 'pending');
    if (paymentStatus === 'paid') {
      const totalPrice = (jobAny.totalPrice as number) || 0;
      return sum + totalPrice;
    }
    return sum;
  }, 0);
  
  const pendingAmount = jobs.reduce((sum, job) => {
    const jobAny = job as unknown as Record<string, unknown>;
    const paymentStatus = String(jobAny.paymentStatus || 'pending');
    if (paymentStatus === 'pending') {
      const totalPrice = (jobAny.totalPrice as number) || 0;
      return sum + totalPrice;
    }
    return sum;
  }, 0);

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
            <Text style={[styles.tableCellHeader, { flex: 0.4 }]}>S/N</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.6 }]}>TYPE</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.8 }]}>DESCRIPTION</Text>
            <Text style={[styles.tableCellHeader, { flex: 1 }]}>CATEGORY</Text>
            <Text style={[styles.tableCellHeader, { flex: 1.2 }]}>SIZE/SPECS</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.5 }]}>QTY</Text>
            <Text style={[styles.tableCellHeader, { flex: 1 }]}>LOCATION</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.7 }]}>RATE</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>TOTAL GHC</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.8 }]}>PAID GHC</Text>
            <Text style={[styles.tableCellHeader, { flex: 0.7 }]}>STATUS</Text>
          </View>

          {/* Table Rows */}
          {tableRows.map((row, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCellData, { flex: 0.4 }]}>{row.sn}</Text>
              <Text style={[styles.tableCellData, { flex: 0.6, fontWeight: 'bold', color: row.jobType === 'QUOTE' ? '#3b82f6' : '#1e293b' }]}>{row.jobType}</Text>
              <Text style={[styles.tableCellData, { flex: 1.8, fontSize: 6.5 }]}>{row.description}</Text>
              <Text style={[styles.tableCellData, { flex: 1, fontSize: 6.5 }]}>{row.category}</Text>
              <Text style={[styles.tableCellData, { flex: 1.2, fontSize: 6.5 }]}>{row.size}</Text>
              <Text style={[styles.tableCellData, { flex: 0.5 }]}>{row.qty}</Text>
              <Text style={[styles.tableCellData, { flex: 1, fontSize: 6.5 }]}>{row.location}</Text>
              <Text style={[styles.tableCellData, { flex: 0.7 }]}>{row.rate}</Text>
              <Text style={[styles.tableCellData, { flex: 0.8, fontWeight: 'bold' }]}>{row.amount}</Text>
              <Text style={[styles.tableCellData, { flex: 0.8, fontWeight: row.amountPaid !== '0.00' ? 'bold' : 'normal', color: row.amountPaid !== '0.00' ? '#22c55e' : '#64748b' }]}>{row.amountPaid}</Text>
              <Text style={[styles.tableCellData, { flex: 0.7, textTransform: 'uppercase', fontSize: 6.5 }]}>{row.paymentStatus}</Text>
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

        {/* Comprehensive Breakdown Section */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Financial Breakdown</Text>
          
          {/* Job Type Breakdown */}
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Quotations ({quotationJobs.length}):</Text>
            <Text style={styles.breakdownValue}>GHC {quotationTotal.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Normal Jobs ({normalJobs.length}):</Text>
            <Text style={styles.breakdownValue}>GHC {normalJobsTotal.toFixed(2)}</Text>
          </View>
          
          <View style={styles.breakdownDivider} />
          
          {/* Payment Status Breakdown */}
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Amount Paid:</Text>
            <Text style={[styles.breakdownValue, { color: '#22c55e', fontWeight: 'bold' }]}>GHC {paidAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Amount Pending:</Text>
            <Text style={[styles.breakdownValue, { color: '#f59e0b', fontWeight: 'bold' }]}>GHC {pendingAmount.toFixed(2)}</Text>
          </View>
          
          <View style={styles.breakdownDivider} />
          
          {/* Total Section */}
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { fontSize: 11, fontWeight: 'bold' }]}>Total Revenue:</Text>
            <Text style={[styles.breakdownValue, { fontSize: 11, fontWeight: 'bold', color: '#1e40af' }]}>GHC {totalAmount.toFixed(2)}</Text>
          </View>
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
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 1,
  },
  tableCellData: {
    fontSize: 6.5,
    color: '#1e293b',
    textAlign: 'center',
    paddingHorizontal: 1,
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
  breakdownSection: {
    marginTop: 15,
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 9,
    color: '#475569',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 9,
    color: '#1e293b',
    fontWeight: '500',
  },
  breakdownDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#cbd5e1',
    marginVertical: 8,
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

