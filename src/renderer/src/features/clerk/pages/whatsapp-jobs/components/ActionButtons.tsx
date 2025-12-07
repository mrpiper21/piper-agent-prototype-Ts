import {
  AiOutlineCheckCircle,
  AiOutlineFileText,
  AiOutlineDollar,
} from 'react-icons/ai';
import type { ThemeStyles, Job } from './types';

interface ActionButtonsProps {
  themeStyles: ThemeStyles;
  job: Job;
  isNeedsQuote: boolean;
  isQuoteSent: boolean;
  isPaymentReceived: boolean;
  isProcessing: boolean;
  onCreateQuote: () => void;
  onMarkCompleted: () => void;
}

export function ActionButtons({
  themeStyles,
  job,
  isNeedsQuote,
  isQuoteSent,
  isPaymentReceived,
  isProcessing,
  onCreateQuote,
  onMarkCompleted,
}: ActionButtonsProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}
    >
      {isNeedsQuote && (
        <button
          onClick={onCreateQuote}
          disabled={isProcessing}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: themeStyles.primaryButton.background,
            color: themeStyles.primaryButton.color,
            fontSize: '14px',
            fontWeight: '600',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          <AiOutlineFileText />
          Create Quote
        </button>
      )}
      {isPaymentReceived && (
        <button
          onClick={onMarkCompleted}
          disabled={isProcessing}
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: themeStyles.success,
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '600',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          <AiOutlineCheckCircle />
          Mark as Complete
        </button>
      )}
      {isQuoteSent && job.metadata?.paymentLink && (
        <a
          href={job.metadata.paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: themeStyles.accent,
            color: '#000000',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            textDecoration: 'none',
          }}
        >
          <AiOutlineDollar />
          View Payment Link
        </a>
      )}
    </div>
  );
}

