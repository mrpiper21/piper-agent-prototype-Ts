import { whatsappService } from './WhatsAppService';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Paystack Webhook Handler
 * 
 * This handler processes Paystack webhook events.
 * In production, Paystack webhooks should be configured to point to your backend API,
 * which then calls this handler via IPC or HTTP endpoint.
 * 
 * For local development, you can use a tool like ngrok to expose a local endpoint.
 */
export class PaystackWebhookHandler {
  private secretKey: string;

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    if (!this.secretKey) {
      logger.warn('Paystack secret key not configured. Webhook verification will fail.');
    }
  }

  /**
   * Verify Paystack webhook signature
   */
  private verifySignature(payload: string, signature: string): boolean {
    if (!this.secretKey) {
      logger.warn('Cannot verify signature: secret key not configured');
      return false;
    }

    const hash = crypto
      .createHmac('sha512', this.secretKey)
      .update(payload)
      .digest('hex');

    return hash === signature;
  }

  /**
   * Handle Paystack webhook event
   * 
   * @param event - Paystack webhook event
   * @param signature - X-Paystack-Signature header value
   * @param rawBody - Raw request body for signature verification
   */
  async handleWebhook(
    event: {
      event: string;
      data: {
        reference: string;
        status: string;
        amount: number;
        currency: string;
        customer: {
          email: string;
          name?: string;
        };
        metadata?: Record<string, unknown>;
      };
    },
    signature?: string,
    rawBody?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Verify signature if provided
      if (signature && rawBody) {
        const isValid = this.verifySignature(rawBody, signature);
        if (!isValid) {
          logger.warn('Invalid Paystack webhook signature');
          return { success: false, message: 'Invalid signature' };
        }
      }

      // Only process successful payment events
      if (event.event !== 'charge.success') {
        logger.info('Ignoring non-payment webhook event', { event: event.event });
        return { success: true, message: 'Event ignored' };
      }

      const { data } = event;

      // Check if payment was successful
      if (data.status !== 'success') {
        logger.info('Payment not successful', { reference: data.reference, status: data.status });
        return { success: false, message: 'Payment not successful' };
      }

      // Process payment via WhatsApp service
      const result = await whatsappService.handlePaymentWebhook({
        reference: data.reference,
        status: data.status,
        amount: data.amount / 100, // Convert from pesewas to GHC
        customer: {
          email: data.customer.email,
        },
      });

      if (result.success) {
        logger.info('Payment webhook processed successfully', {
          reference: data.reference,
          amount: data.amount / 100,
        });
        return { success: true, message: 'Payment processed successfully' };
      } else {
        logger.warn('Payment webhook processing failed', {
          reference: data.reference,
        });
        return { success: false, message: 'Failed to process payment' };
      }
    } catch (error) {
      logger.error('Error handling Paystack webhook:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const paystackWebhookHandler = new PaystackWebhookHandler();

