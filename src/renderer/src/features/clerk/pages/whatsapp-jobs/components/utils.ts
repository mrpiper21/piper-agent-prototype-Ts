import { AiOutlineCheckCircle } from 'react-icons/ai';
import type { StatusInfo } from './types';

export function getStatusInfo(status: string | undefined): StatusInfo {
  const statusLower = (status || '').toLowerCase();
  if (statusLower === 'completed') {
    return {
      text: 'Completed',
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.15)',
      icon: AiOutlineCheckCircle,
    };
  }
  if (statusLower === 'payment_received' || statusLower === 'processing') {
    return {
      text: 'Payment Received - In Progress',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.15)',
      icon: AiOutlineCheckCircle,
    };
  }
  if (statusLower === 'quote_sent' || statusLower === 'awaiting_payment') {
    return {
      text: 'Quote Sent - Awaiting Payment',
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.15)',
      icon: null,
    };
  }
  if (statusLower === 'needs_quote') {
    return {
      text: 'Needs Quote',
      color: '#ef4444',
      bg: 'rgba(239, 68, 68, 0.15)',
      icon: null,
    };
  }
  return {
    text: status || 'Unknown',
    color: '#6b7280',
    bg: 'rgba(107, 114, 128, 0.15)',
    icon: null,
  };
}

export function getContactInfo(job: {
  clientId?: { phoneNumber?: string; email?: string } | string;
  metadata?: { whatsappContact?: string };
}) {
  let phone = '';
  let email = '';

  if (job.clientId && typeof job.clientId === 'object') {
    phone = job.clientId.phoneNumber || '';
    email = (job.clientId as { email?: string }).email || '';
  }

  if (job.metadata?.whatsappContact) {
    const contact = job.metadata.whatsappContact;
    const phoneMatch = contact.match(/^(\d+)@/);
    if (phoneMatch) {
      phone = phoneMatch[1];
    }
  }

  return { phone, email: email || `${phone}@whatsapp.local` };
}

