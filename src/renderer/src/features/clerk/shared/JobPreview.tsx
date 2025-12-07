import { useTheme } from '../../../context/ThemeContext';
import { lightStyles, darkStyles } from './clerkStyles';
import { FilePreview } from './FilePreview';
import { JobDetails } from './JobDetails';
import { useMemo } from 'react';
import { AiOutlineDollar, AiOutlineFileText, AiOutlineInfoCircle } from 'react-icons/ai';

interface JobPreviewProps {
  job: any;
  onClose: () => void;
}

// Helper function to get field value from job or metadata
const getFieldValue = (job: any, fieldName: string): string | number | undefined => {
  return job[fieldName] || job.metadata?.[fieldName] || undefined;
};

// Helper function to format category type name
const formatCategoryType = (type: string): string => {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
};

export function JobPreview({ job, onClose }: JobPreviewProps) {
  const { theme } = useTheme();
  const themeStyles = theme === 'dark' ? darkStyles : lightStyles;

  // Get category type from populated categoryId
  const categoryType = useMemo(() => {
    if (job.categoryId && typeof job.categoryId === 'object') {
      return job.categoryId.categoryType;
    }
    return null;
  }, [job.categoryId]);

  // Extract field values - these are direct fields on the PDFPrint model
  const indexNumber = job.indexNumber || job.metadata?.indexNumber;
  const yearOfCompletion = job.yearOfCompletion || job.metadata?.yearOfCompletion;
  const dateOfBirth = job.dateOfBirth || job.metadata?.dateOfBirth;
  const width = job.width;
  const height = job.height;
  const copies = job.copies || job.quantity || 1;
  const hasFile = !!(job.fileName || job.cloudinaryUrl || job.fileStackUrl);

  // Get client information from populated clientId
  const clientInfo = useMemo(() => {
    if (job.clientId && typeof job.clientId === 'object') {
      return {
        fullName: job.clientId.fullName,
        phoneNumber: job.clientId.phoneNumber,
        email: job.clientId.email,
      };
    }
    return null;
  }, [job.clientId]);

  // Check if this is a quotation job
  const isQuotation = useMemo(() => job.isQuotation === true, [job.isQuotation]);

  // Get payment status color
  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return '#22c55e';
      case 'pending':
        return '#f59e0b';
      case 'failed':
        return '#ef4444';
      case 'refunded':
        return '#6b7280';
      default:
        return themeStyles.textSecondary;
    }
  };

  // Format payment status text
  const formatPaymentStatus = (paymentStatus: string) => {
    if (!paymentStatus) return 'Pending';
    return paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1).toLowerCase();
  };

  // Determine what to show based on category type
  const isResultChecker = categoryType === 'wassce_result' || categoryType === 'bece_result' || categoryType === 'novdec_result';
  const isFormatCategory = categoryType === 'large_format' || categoryType === 'regular_format';
  const isLargeFormat = categoryType === 'large_format';
  const isNovDec = categoryType === 'novdec_result';
  const isWassceOrBece = categoryType === 'wassce_result' || categoryType === 'bece_result';

  return (
    <div
      style={{
        flex: '1',
        background: themeStyles.container.background,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--spacing-md, 12px)',
          borderBottom: themeStyles.card.border,
          flexShrink: 0,
          background: themeStyles.card.background,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h2
            style={{
              color: isQuotation ? '#3b82f6' : '#fbbf24',
              fontWeight: '600',
              fontSize: 'var(--font-size-large, 16px)',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {isQuotation && <AiOutlineDollar style={{ fontSize: '18px' }} />}
            {isQuotation ? 'Quote Preview' : 'Job Preview'}
          </h2>
          {isQuotation ? (
            <span
              style={{
                color: '#3b82f6',
                fontSize: 'var(--font-size-small, 12px)',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'rgba(59, 130, 246, 0.15)',
                display: 'inline-block',
                width: 'fit-content',
              }}
            >
              QUOTATION
            </span>
          ) : categoryType ? (
            <span
              style={{
                color: themeStyles.textSecondary,
                fontSize: 'var(--font-size-small, 12px)',
                fontWeight: '500',
              }}
            >
              {formatCategoryType(categoryType)}
            </span>
          ) : null}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            padding: 'var(--spacing-xs, 4px) var(--spacing-sm, 8px)',
            border: 'none',
            borderRadius: 'var(--border-radius-sm, 4px)',
            cursor: 'pointer',
            background: 'transparent',
            color: themeStyles.textSecondary,
            fontWeight: '500',
            fontSize: 'var(--font-size-small, 12px)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs, 4px)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = themeStyles.button.background;
            e.currentTarget.style.color = themeStyles.text;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = themeStyles.textSecondary;
          }}
        >
          ✕ Close
        </button>
      </div>

      {/* Scrollable Content */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          flexDirection: isQuotation || isResultChecker ? 'column' : 'row',
          gap: 'var(--spacing-md, 12px)',
          padding: 'var(--spacing-md, 12px)',
        }}
      >
        {/* File Preview Section - Only show for format categories or if file exists, NOT for quotations */}
        {!isQuotation && (isFormatCategory || hasFile) && (
          <div
            style={{
              flex: isResultChecker ? 'none' : '1 1 60%',
              minWidth: 0,
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              ...(isResultChecker && {
                maxHeight: '300px',
                marginBottom: 'var(--spacing-md, 12px)',
              }),
            }}
          >
            <FilePreview fileName={job.fileName} fileUrl={job?.cloudinaryUrl || job?.fileStackUrl} />
          </div>
        )}

        {/* Right Side - Job Details / Quotation Details */}
        <div
          style={{
            flex: isQuotation || isResultChecker ? 'none' : '0 0 40%',
            minWidth: '300px',
            maxWidth: isQuotation || isResultChecker ? '100%' : '500px',
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-md, 12px)',
          }}
        >
          {/* Quotation Job Section */}
          {isQuotation && (
            <>
              {/* Order Description */}
              {job.orderDescription && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                    border: '2px solid #3b82f6',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <AiOutlineFileText
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: '#3b82f6',
                        flexShrink: 0,
                      }}
                    />
                    <h3
                      style={{
                        color: '#3b82f6',
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Order Description
                    </h3>
                  </div>
                  <p
                    style={{
                      color: themeStyles.text,
                      fontSize: 'var(--font-size, 14px)',
                      margin: 0,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {job.orderDescription}
                  </p>
                </div>
              )}

              {/* Specifications */}
              {job.specifications && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.12)',
                    border: `2px solid ${themeStyles.accent}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: `4px solid ${themeStyles.accent}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: themeStyles.accent,
                        flexShrink: 0,
                      }}
                    >
                      📋
                    </span>
                    <h3
                      style={{
                        color: themeStyles.accent,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Specifications
                    </h3>
                  </div>
                  <p
                    style={{
                      color: themeStyles.text,
                      fontSize: 'var(--font-size, 14px)',
                      margin: 0,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {job.specifications}
                  </p>
                </div>
              )}

              {/* Quantity and Total Price */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-md, 12px)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Quantity */}
                {job.quantity && (
                  <div
                    style={{
                      flex: '1 1 200px',
                      padding: 'var(--spacing-md, 12px)',
                      background:
                        theme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.12)',
                      border: '2px solid #8b5cf6',
                      borderRadius: 'var(--border-radius-md, 6px)',
                      borderLeft: '4px solid #8b5cf6',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm, 8px)',
                        marginBottom: 'var(--spacing-sm, 8px)',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--icon-size-lg, 20px)',
                          color: '#8b5cf6',
                          flexShrink: 0,
                        }}
                      >
                        📄
                      </span>
                      <h3
                        style={{
                          color: '#8b5cf6',
                          fontSize: 'var(--font-size, 14px)',
                          fontWeight: '600',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Quantity
                      </h3>
                    </div>
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {job.quantity}
                    </span>
                  </div>
                )}

                {/* Total Price */}
                {job.totalPrice && (
                  <div
                    style={{
                      flex: '1 1 200px',
                      padding: 'var(--spacing-md, 12px)',
                      background:
                        theme === 'dark' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.12)',
                      border: '2px solid #22c55e',
                      borderRadius: 'var(--border-radius-md, 6px)',
                      borderLeft: '4px solid #22c55e',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm, 8px)',
                        marginBottom: 'var(--spacing-sm, 8px)',
                      }}
                    >
                      <AiOutlineDollar
                        style={{
                          fontSize: 'var(--icon-size-lg, 20px)',
                          color: '#22c55e',
                          flexShrink: 0,
                        }}
                      />
                      <h3
                        style={{
                          color: '#22c55e',
                          fontSize: 'var(--font-size, 14px)',
                          fontWeight: '600',
                          margin: 0,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Total Price
                      </h3>
                    </div>
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      ₵{Number(job.totalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Payment Status and Reference */}
              <div
                style={{
                  display: 'flex',
                  gap: 'var(--spacing-md, 12px)',
                  flexWrap: 'wrap',
                }}
              >
                {/* Payment Status */}
                <div
                  style={{
                    flex: '1 1 200px',
                    padding: 'var(--spacing-md, 12px)',
                    background: themeStyles.card.background,
                    border: `1px solid ${themeStyles.card.border}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                  }}
                >
                  <h3
                    style={{
                      color: themeStyles.text,
                      fontSize: 'var(--font-size, 14px)',
                      fontWeight: '600',
                      margin: '0 0 var(--spacing-sm, 8px) 0',
                    }}
                  >
                    Payment Status
                  </h3>
                  <span
                    style={{
                      color: getPaymentStatusColor(job.paymentStatus || 'pending'),
                      fontSize: 'var(--font-size, 14px)',
                      fontWeight: '600',
                      padding: '4px 12px',
                      borderRadius: '4px',
                      background: `${getPaymentStatusColor(job.paymentStatus || 'pending')}20`,
                      display: 'inline-block',
                    }}
                  >
                    {formatPaymentStatus(job.paymentStatus || 'pending')}
                  </span>
                </div>

                {/* Payment Reference */}
                {job.paymentReference && (
                  <div
                    style={{
                      flex: '1 1 200px',
                      padding: 'var(--spacing-md, 12px)',
                      background: themeStyles.card.background,
                      border: `1px solid ${themeStyles.card.border}`,
                      borderRadius: 'var(--border-radius-md, 6px)',
                    }}
                  >
                    <h3
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: '0 0 var(--spacing-sm, 8px) 0',
                      }}
                    >
                      Payment Reference
                    </h3>
                    <p
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        margin: 0,
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                      }}
                    >
                      {job.paymentReference}
                    </p>
                  </div>
                )}
              </div>

              {/* Internal Notes */}
              {job.internalNotes && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background: themeStyles.card.background,
                    border: `1px solid ${themeStyles.card.border}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <AiOutlineInfoCircle
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: themeStyles.textSecondary,
                        flexShrink: 0,
                      }}
                    />
                    <h3
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                      }}
                    >
                      Internal Notes
                    </h3>
                  </div>
                  <p
                    style={{
                      color: themeStyles.text,
                      fontSize: 'var(--font-size, 14px)',
                      margin: 0,
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      fontStyle: 'italic',
                    }}
                  >
                    {job.internalNotes}
                  </p>
                </div>
              )}
            </>
          )}
          {/* Result Checker Categories - wassce_result, bece_result, novdec_result */}
          {isResultChecker && (
            <>
              {/* Index Number */}
              {indexNumber && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.12)',
                    border: `2px solid ${themeStyles.accent}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: `4px solid ${themeStyles.accent}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: themeStyles.accent,
                        flexShrink: 0,
                      }}
                    >
                      🔢
                    </span>
                    <h3
                      style={{
                        color: themeStyles.accent,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Index Number
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {String(indexNumber)}
                    </span>
                  </div>
                </div>
              )}

              {/* Year of Completion */}
              {yearOfCompletion && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                    border: '2px solid #3b82f6',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: '#3b82f6',
                        flexShrink: 0,
                      }}
                    >
                      📅
                    </span>
                    <h3
                      style={{
                        color: '#3b82f6',
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Year of Completion
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {String(yearOfCompletion)}
                    </span>
                  </div>
                </div>
              )}

              {/* Date of Birth - Only for novdec_result */}
              {isNovDec && dateOfBirth && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(34, 197, 94, 0.12)',
                    border: '2px solid #22c55e',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: '4px solid #22c55e',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: '#22c55e',
                        flexShrink: 0,
                      }}
                    >
                      🎂
                    </span>
                    <h3
                      style={{
                        color: '#22c55e',
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Date of Birth
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-xl, 18px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {typeof dateOfBirth === 'string' 
                        ? new Date(dateOfBirth).toLocaleDateString() 
                        : String(dateOfBirth)}
                    </span>
                  </div>
                </div>
              )}

              {/* Empty state for result checker if no data */}
              {isWassceOrBece && !indexNumber && !yearOfCompletion && (
                <div
                  style={{
                    padding: 'var(--spacing-lg, 16px)',
                    textAlign: 'center',
                    color: themeStyles.textSecondary,
                    background: themeStyles.card.background,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    border: `1px dashed ${themeStyles.card.border}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--font-size, 14px)' }}>
                    No result checker data available. Please provide index number and year of completion.
                  </p>
                </div>
              )}
              {isNovDec && !indexNumber && !yearOfCompletion && !dateOfBirth && (
                <div
                  style={{
                    padding: 'var(--spacing-lg, 16px)',
                    textAlign: 'center',
                    color: themeStyles.textSecondary,
                    background: themeStyles.card.background,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    border: `1px dashed ${themeStyles.card.border}`,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 'var(--font-size, 14px)' }}>
                    No result checker data available. Please provide index number, year of completion, and date of birth.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Format Categories - large_format, regular_format */}
          {isFormatCategory && (
            <>
              {/* Print Dimensions - Only for large_format */}
              {isLargeFormat && width && height && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.12)',
                    border: `2px solid ${themeStyles.accent}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: `4px solid ${themeStyles.accent}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: themeStyles.accent,
                        flexShrink: 0,
                      }}
                    >
                      📐
                    </span>
                    <h3
                      style={{
                        color: themeStyles.accent,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Print Dimensions
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-md, 12px)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
                    >
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          fontWeight: '500',
                        }}
                      >
                        Width:
                      </span>
                      <span
                        style={{
                          color: themeStyles.text,
                          fontSize: 'var(--font-size-xl, 18px)',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                        }}
                      >
                        {width}
                      </span>
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          marginLeft: '2px',
                        }}
                      >
                        px
                      </span>
                    </div>
                    <span
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size-large, 16px)',
                        fontWeight: '300',
                      }}
                    >
                      ×
                    </span>
                    <div
                      style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
                    >
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          fontWeight: '500',
                        }}
                      >
                        Height:
                      </span>
                      <span
                        style={{
                          color: themeStyles.text,
                          fontSize: 'var(--font-size-xl, 18px)',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                        }}
                      >
                        {height}
                      </span>
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          marginLeft: '2px',
                        }}
                      >
                        px
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: 'var(--font-size-small, 12px)',
                      marginTop: 'var(--spacing-sm, 8px)',
                      marginBottom: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    These dimensions determine how the item will be printed
                  </p>
                </div>
              )}

              {/* Number of Copies - For both format categories */}
              {copies !== undefined && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                    border: '2px solid #3b82f6',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: '#3b82f6',
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </span>
                    <h3
                      style={{
                        color: '#3b82f6',
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Number of Copies
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {copies}
                    </span>
                    <span
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size, 14px)',
                        marginLeft: 'var(--spacing-xs, 4px)',
                      }}
                    >
                      {copies === 1 ? 'copy' : 'copies'}
                    </span>
                  </div>
                  <p
                    style={{
                      color: themeStyles.textSecondary,
                      fontSize: 'var(--font-size-small, 12px)',
                      marginTop: 'var(--spacing-sm, 8px)',
                      marginBottom: 0,
                      fontStyle: 'italic',
                    }}
                  >
                    This is how many times the item will be printed
                  </p>
                </div>
              )}

              {/* File Info Section - Show file details if available */}
              {hasFile && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background: themeStyles.card.background,
                    border: `1px solid ${themeStyles.card.border}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                  }}
                >
                  <h3
                    style={{
                      color: themeStyles.text,
                      fontSize: 'var(--font-size, 14px)',
                      fontWeight: '600',
                      margin: '0 0 var(--spacing-sm, 8px) 0',
                    }}
                  >
                    File Information
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs, 4px)' }}>
                    {job.fileName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)' }}>
                          File Name:
                        </span>
                        <span style={{ color: themeStyles.text, fontSize: 'var(--font-size-small, 12px)', fontWeight: '500' }}>
                          {job.fileName}
                        </span>
                      </div>
                    )}
                    {job.originalName && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)' }}>
                          Original Name:
                        </span>
                        <span style={{ color: themeStyles.text, fontSize: 'var(--font-size-small, 12px)', fontWeight: '500' }}>
                          {job.originalName}
                        </span>
                      </div>
                    )}
                    {job.fileSize && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: themeStyles.textSecondary, fontSize: 'var(--font-size-small, 12px)' }}>
                          File Size:
                        </span>
                        <span style={{ color: themeStyles.text, fontSize: 'var(--font-size-small, 12px)', fontWeight: '500' }}>
                          {typeof job.fileSize === 'number' 
                            ? `${(job.fileSize / 1024).toFixed(2)} KB` 
                            : job.fileSize}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Regular Categories (no categoryType) or fallback */}
          {!isResultChecker && !isFormatCategory && (
            <>
              {/* Print Dimensions - Show if available */}
              {width && height && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(251, 191, 36, 0.08)' : 'rgba(251, 191, 36, 0.12)',
                    border: `2px solid ${themeStyles.accent}`,
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: `4px solid ${themeStyles.accent}`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: themeStyles.accent,
                        flexShrink: 0,
                      }}
                    >
                      📐
                    </span>
                    <h3
                      style={{
                        color: themeStyles.accent,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Print Dimensions
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-md, 12px)',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
                    >
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          fontWeight: '500',
                        }}
                      >
                        Width:
                      </span>
                      <span
                        style={{
                          color: themeStyles.text,
                          fontSize: 'var(--font-size-xl, 18px)',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                        }}
                      >
                        {width}
                      </span>
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          marginLeft: '2px',
                        }}
                      >
                        px
                      </span>
                    </div>
                    <span
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size-large, 16px)',
                        fontWeight: '300',
                      }}
                    >
                      ×
                    </span>
                    <div
                      style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--spacing-xs, 4px)' }}
                    >
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          fontWeight: '500',
                        }}
                      >
                        Height:
                      </span>
                      <span
                        style={{
                          color: themeStyles.text,
                          fontSize: 'var(--font-size-xl, 18px)',
                          fontWeight: '700',
                          fontFamily: 'monospace',
                        }}
                      >
                        {height}
                      </span>
                      <span
                        style={{
                          color: themeStyles.textSecondary,
                          fontSize: 'var(--font-size-small, 12px)',
                          marginLeft: '2px',
                        }}
                      >
                        px
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Number of Copies */}
              {copies !== undefined && (
                <div
                  style={{
                    padding: 'var(--spacing-md, 12px)',
                    background:
                      theme === 'dark' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.12)',
                    border: '2px solid #3b82f6',
                    borderRadius: 'var(--border-radius-md, 6px)',
                    borderLeft: '4px solid #3b82f6',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-sm, 8px)',
                      marginBottom: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--icon-size-lg, 20px)',
                        color: '#3b82f6',
                        flexShrink: 0,
                      }}
                    >
                      📄
                    </span>
                    <h3
                      style={{
                        color: '#3b82f6',
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Number of Copies
                    </h3>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 'var(--spacing-sm, 8px)',
                    }}
                  >
                    <span
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size-2xl, 24px)',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        lineHeight: '1',
                      }}
                    >
                      {copies}
                    </span>
                    <span
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size, 14px)',
                        marginLeft: 'var(--spacing-xs, 4px)',
                      }}
                    >
                      {copies === 1 ? 'copy' : 'copies'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Client Information Section */}
          {clientInfo && (
            <div
              style={{
                padding: 'var(--spacing-md, 12px)',
                background:
                  theme === 'dark' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(139, 92, 246, 0.12)',
                border: '2px solid #8b5cf6',
                borderRadius: 'var(--border-radius-md, 6px)',
                borderLeft: '4px solid #8b5cf6',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm, 8px)',
                  marginBottom: 'var(--spacing-sm, 8px)',
                }}
              >
                <span
                  style={{
                    fontSize: 'var(--icon-size-lg, 20px)',
                    color: '#8b5cf6',
                    flexShrink: 0,
                  }}
                >
                  👤
                </span>
                <h3
                  style={{
                    color: '#8b5cf6',
                    fontSize: 'var(--font-size, 14px)',
                    fontWeight: '600',
                    margin: 0,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Client Information
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm, 8px)' }}>
                {clientInfo.fullName && (
                  <div>
                    <p
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size-small, 12px)',
                        margin: '0 0 var(--spacing-xs, 4px) 0',
                        fontWeight: '500',
                      }}
                    >
                      Full Name
                    </p>
                    <p
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                      }}
                    >
                      {clientInfo.fullName}
                    </p>
                  </div>
                )}
                {clientInfo.phoneNumber && (
                  <div>
                    <p
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size-small, 12px)',
                        margin: '0 0 var(--spacing-xs, 4px) 0',
                        fontWeight: '500',
                      }}
                    >
                      Phone Number
                    </p>
                    <p
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        fontWeight: '600',
                        margin: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {clientInfo.phoneNumber}
                    </p>
                  </div>
                )}
                {clientInfo.email && (
                  <div>
                    <p
                      style={{
                        color: themeStyles.textSecondary,
                        fontSize: 'var(--font-size-small, 12px)',
                        margin: '0 0 var(--spacing-xs, 4px) 0',
                        fontWeight: '500',
                      }}
                    >
                      Email
                    </p>
                    <p
                      style={{
                        color: themeStyles.text,
                        fontSize: 'var(--font-size, 14px)',
                        margin: 0,
                        wordBreak: 'break-word',
                      }}
                    >
                      {clientInfo.email}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Details Component - Always show at bottom */}
          <JobDetails job={job} />
        </div>
      </div>
    </div>
  );
}
