import { useState } from 'react';
import {
  AiOutlineClose,
  AiOutlineSend,
  AiOutlineFileText,
  AiOutlineInfoCircle,
} from 'react-icons/ai';
import type { lightStyles } from '../../../shared/clerkStyles';
// import { PAYMENT_LINK_BASE_URL } from '../../../../../../main/services/api';
// import { useSelector } from 'react-redux';
import { useAuthStore } from '../../../../auth/store/authStore';

type ThemeStyles = typeof lightStyles;

interface QuoteFormProps {
  themeStyles: ThemeStyles;
  job: {
    id?: string;
    _id?: string;
    printJobId?: string;
    metadata?: {
      whatsappContact?: string;
      notes?: string;
    };
    description?: string;
    clientId?:
      | {
          fullName?: string;
          phoneNumber?: string;
        }
      | string;
  };
  onClose: () => void;
  onSubmit: (quoteData: QuoteData) => Promise<void>;
}

export interface QuoteData {
  orderDescription: string;
  quantity?: string;
  specifications: string;
  price: number;
  internalNotes?: string;
  adminId: string;
}

export function QuoteForm({ themeStyles, job: _job, onClose, onSubmit }: QuoteFormProps) {
  const [orderDescription, setOrderDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [specifications, setSpecifications] = useState('');
  const [price, setPrice] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  // const adminId = useSelector((state: RootState) => state.auth.user?.id);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!orderDescription.trim()) {
      setError('Order description is required');
      return;
    }

    if (!specifications.trim()) {
      setError('Specifications are required');
      return;
    }

    const priceNum = parseFloat(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setError('Please enter a valid price');
      return;
    }

    // Calculate service fee (1.5%) and total price
    const serviceFee = priceNum * 0.015;
    const totalPrice = priceNum + serviceFee;

    setIsSubmitting(true);
    try {
      await onSubmit({
        adminId: user?.id || '',
        orderDescription: orderDescription.trim(),
        quantity: quantity.trim() || undefined,
        specifications: specifications.trim(),
        price: totalPrice, // Send total price (base + service fee)
        internalNotes: internalNotes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create quote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDark =
    themeStyles.container.background === '#1a1a1a' ||
    themeStyles.container.background === '#262626';

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>
        {`
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes slideUp {
              from { transform: translateY(20px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
          `}
      </style>
      <div
        style={{
          background: themeStyles.card.background,
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '640px',
          // width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: isDark
            ? '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
            : '0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          border: `1px solid ${themeStyles.card.border}`,
          animation: 'slideUp 0.3s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
            paddingBottom: '10px',
            borderBottom: `1px solid ${themeStyles.card.border}`,
          }}
        >
          <div>
            <h2
              style={{
                color: themeStyles.text,
                fontSize: '24px',
                fontWeight: '700',
                margin: '0 0 4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AiOutlineFileText style={{ color: themeStyles.accent, fontSize: '26px' }} />
              Create Quote
            </h2>
            <p
              style={{
                color: themeStyles.textSecondary,
                fontSize: '14px',
                margin: 0,
                fontWeight: '400',
              }}
            >
              Fill in the details to send a quote and payment link to the client
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: themeStyles.textSecondary,
              fontSize: '22px',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              width: '32px',
              height: '32px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = themeStyles.input.background;
              e.currentTarget.style.color = themeStyles.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = themeStyles.textSecondary;
            }}
          >
            <AiOutlineClose />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              marginBottom: '10px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: '500',
            }}
          >
            <AiOutlineInfoCircle style={{ fontSize: '18px', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Order Description */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '5px',
                  letterSpacing: '0.01em',
                }}
              >
                Order Description
                <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              </label>
              <textarea
                value={orderDescription}
                onChange={(e) => setOrderDescription(e.target.value)}
                placeholder="Describe what the client wants to print..."
                required
                rows={3}
                style={{
                  width: '85%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.input.color,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  lineHeight: '1.5',
                  minHeight: '80px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.card.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Quantity */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '5px',
                  letterSpacing: '0.01em',
                }}
              >
                Quantity
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontWeight: '400',
                    fontSize: '13px',
                    marginLeft: '6px',
                  }}
                >
                  (Optional)
                </span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow positive numbers (including decimals)
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setQuantity(value);
                  }
                }}
                placeholder="e.g., 50, 2, 100"
                min="0"
                step="1"
                style={{
                  width: '85%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.input.color,
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.card.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Specifications */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '5px',
                  letterSpacing: '0.01em',
                }}
              >
                Specifications
                <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>
              </label>
              <textarea
                value={specifications}
                onChange={(e) => setSpecifications(e.target.value)}
                placeholder="Paper type, size, color, finishing, binding, etc."
                required
                rows={5}
                style={{
                  width: '85%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.input.color,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  lineHeight: '1.5',
                  minHeight: '100px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.card.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Price */}
            <div>
              <label
                style={{
                  display: 'block',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '5px',
                  letterSpacing: '0.01em',
                }}
              >
                Base Price (GHC)
                <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                  min="0"
                  step="0.01"
                  style={{
                    width: '75%',
                    padding: '14px 16px 14px 48px',
                    borderRadius: '10px',
                    border: `1.5px solid ${themeStyles.card.border}`,
                    background: themeStyles.input.background,
                    color: themeStyles.input.color,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    fontFamily: 'inherit',
                    fontWeight: '500',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.accent;
                    e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = themeStyles.card.border;
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: themeStyles.textSecondary,
                    fontSize: '18px',
                    fontWeight: '600',
                    pointerEvents: 'none',
                  }}
                >
                  ₵
                </span>
              </div>
              {/* Service Fee Breakdown */}
              {price && !isNaN(parseFloat(price)) && parseFloat(price) > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
                    border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)'}`,
                    fontSize: '13px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ color: themeStyles.textSecondary }}>transaction charges:</span>
                    <span style={{ color: themeStyles.text, fontWeight: '500' }}>
                      ₵{parseFloat(price).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '4px',
                    }}
                  >
                    <span style={{ color: themeStyles.textSecondary }}>Transaction Charges (1.5%):</span>
                    <span style={{ color: themeStyles.text, fontWeight: '500' }}>
                      ₵{(parseFloat(price) * 0.015).toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '6px',
                      borderTop: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.15)'}`,
                      marginTop: '4px',
                    }}
                  >
                    <span style={{ color: themeStyles.text, fontWeight: '600' }}>Total Price:</span>
                    <span
                      style={{ color: themeStyles.accent, fontWeight: '700', fontSize: '15px' }}
                    >
                      ₵{(parseFloat(price) * 1.015).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Internal Notes */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: themeStyles.text,
                  fontSize: '14px',
                  fontWeight: '600',
                  letterSpacing: '0.01em',
                  marginBottom: '5px',
                }}
              >
                <AiOutlineInfoCircle
                  style={{ fontSize: '16px', color: themeStyles.textSecondary }}
                />
                Internal Notes
                <span
                  style={{
                    color: themeStyles.textSecondary,
                    fontWeight: '400',
                    fontSize: '13px',
                    marginLeft: '4px',
                  }}
                >
                  (Optional)
                </span>
              </label>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="For your reference only..."
                rows={3}
                style={{
                  width: '85%',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.input.color,
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  lineHeight: '1.5',
                  minHeight: '70px',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.accent;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${themeStyles.accent}20`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = themeStyles.card.border;
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
                paddingTop: '10px',
                borderTop: `1px solid ${themeStyles.card.border}`,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: `1.5px solid ${themeStyles.card.border}`,
                  background: themeStyles.input.background,
                  color: themeStyles.text,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : 'rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.borderColor = themeStyles.textSecondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.background = themeStyles.input.background;
                    e.currentTarget.style.borderColor = themeStyles.card.border;
                  }
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: '14px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: themeStyles.primaryButton.background,
                  color: themeStyles.primaryButton.color,
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <AiOutlineSend style={{ fontSize: '18px' }} />
                {isSubmitting ? 'Sending...' : 'Send Quote & Payment Link'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
