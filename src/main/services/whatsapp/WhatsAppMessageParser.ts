import { logger } from '../../utils/logger';

export interface WhatsAppJobDetails {
  fileName?: string;
  printerName?: string;
  copies?: number;
  colorMode?: 'color' | 'grayscale' | 'black-white';
  orientation?: 'portrait' | 'landscape';
  paperSize?: string;
  duplex?: boolean;
  notes?: string;
}

export class WhatsAppMessageParser {
  /**
   * Check if message is a print command
   */
  static isPrintCommand(messageBody: string, isPrintCommandFlag?: boolean): boolean {
    if (isPrintCommandFlag === true) {
      return true;
    }
    return messageBody.trim().toLowerCase().startsWith('/print');
  }

  /**
   * Extract description from print command
   */
  static extractDescriptionFromPrintCommand(messageBody: string): string {
    return messageBody.replace(/\/print/gi, '').trim() || 'Print request';
  }

  /**
   * Parse job details from message text
   * Supports formats like:
   * - "Print: filename.pdf, Printer: HP LaserJet, Copies: 2"
   * - "Printer: Canon, Copies: 1, Color: grayscale"
   */
  static parseJobDetails(messageText: string): WhatsAppJobDetails {
    const details: WhatsAppJobDetails = {};

    // Extract printer name
    const printerMatch = messageText.match(/printer[:\s]+([^,\n]+)/i);
    if (printerMatch) {
      details.printerName = printerMatch[1].trim();
    }

    // Extract copies
    const copiesMatch = messageText.match(/copies[:\s]+(\d+)/i);
    if (copiesMatch) {
      details.copies = parseInt(copiesMatch[1], 10);
    }

    // Extract color mode
    const colorMatch = messageText.match(/color[:\s]+(color|grayscale|black-white|bw|black and white)/i);
    if (colorMatch) {
      const colorMode = colorMatch[1].toLowerCase();
      if (colorMode === 'bw' || colorMode === 'black and white') {
        details.colorMode = 'black-white';
      } else if (colorMode === 'grayscale') {
        details.colorMode = 'grayscale';
      } else {
        details.colorMode = 'color';
      }
    }

    // Extract orientation
    const orientationMatch = messageText.match(/orientation[:\s]+(portrait|landscape)/i);
    if (orientationMatch) {
      details.orientation = orientationMatch[1].toLowerCase() as 'portrait' | 'landscape';
    }

    // Extract paper size
    const paperSizeMatch = messageText.match(/paper[:\s]+(A4|A3|Letter|Legal)/i);
    if (paperSizeMatch) {
      details.paperSize = paperSizeMatch[1];
    }

    // Extract duplex
    const duplexMatch = messageText.match(/duplex[:\s]+(yes|no|true|false)/i);
    if (duplexMatch) {
      details.duplex = ['yes', 'true'].includes(duplexMatch[1].toLowerCase());
    }

    // Extract filename (if mentioned)
    const fileNameMatch = messageText.match(/filename[:\s]+([^,\n]+)/i);
    if (fileNameMatch) {
      details.fileName = fileNameMatch[1].trim();
    }

    // Extract notes (everything else)
    details.notes = messageText;

    return details;
  }

  /**
   * Validate incoming message data
   */
  static validateMessageData(messageData: unknown): {
    isValid: boolean;
    error?: string;
    data?: {
      from: string;
      messageId: string;
      body: string;
      hasMedia: boolean;
      isPrintCommand: boolean;
    };
  } {
    if (!messageData) {
      return { isValid: false, error: 'Received null or undefined message data' };
    }

    const data = messageData as Record<string, unknown>;
    if (!data.from) {
      return { isValid: false, error: 'Received message without from field' };
    }

    const messageBody = (data.body as string) || '';
    const isPrintCommand = this.isPrintCommand(messageBody, data.isPrintCommand as boolean | undefined);

    return {
      isValid: true,
      data: {
        from: data.from as string,
        messageId: (data.messageId as string) || '',
        body: messageBody,
        hasMedia: (data.hasMedia as boolean) || false,
        isPrintCommand,
      },
    };
  }
}

