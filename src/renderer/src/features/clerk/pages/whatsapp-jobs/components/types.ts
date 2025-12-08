import type { lightStyles } from '../../../shared/clerkStyles';

export type ThemeStyles = typeof lightStyles;

export interface Job {
  id?: string;
  _id?: string;
  printJobId?: string;
  fileName?: string;
  status?: string;
  copies?: number;
  quantity?: number;
  description?: string;
  metadata?: {
    whatsappContact?: string;
    whatsappMessageId?: string;
    notes?: string;
    colorMode?: string;
    paperSize?: string;
    duplex?: boolean;
    binding?: boolean;
    total?: number;
    paymentLink?: string;
    orderDescription?: string;
    specifications?: string;
    internalNotes?: string;
    quoteReference?: string;
    contactName?: string;
    isConversation?: boolean;
    messages?: Array<{
      contact: string;
      contactName: string;
      messageId: string;
      body: string;
      timestamp: number;
      hasMedia: boolean;
      isPrintCommand: boolean;
      media?: {
        mimetype: string;
        filename: string;
        filePath?: string;
      };
    }>;
    attachedFiles?: Array<{
      filePath: string;
      fileName: string;
      fileType: string;
      messageId?: string;
    }>;
  };
  clientId?: {
    fullName?: string;
    phoneNumber?: string;
  } | string;
  createdAt?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

export interface StatusInfo {
  text: string;
  color: string;
  bg: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }> | null;
}

