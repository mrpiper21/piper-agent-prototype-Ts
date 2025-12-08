import axios, { type AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface PaystackPaymentLinkParams {
  amount: number; // Amount in pesewas (GHC * 100)
  email: string;
  reference: string;
  metadata?: Record<string, unknown>;
  callbackUrl?: string;
  description?: string;
}

interface PaystackPaymentLinkResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export class PaystackService {
  private axiosInstance: AxiosInstance;
  private secretKey: string;
  private publicKey: string;

  constructor() {
    // Get Paystack keys from environment or config
    // In production, these should be stored securely
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';

    if (!this.secretKey || !this.publicKey) {
      logger.warn('Paystack keys not configured. Payment links will not work.');
    }

    this.axiosInstance = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Generate a payment link for a quote
   */
  async generatePaymentLink(params: PaystackPaymentLinkParams): Promise<string> {
    try {
      if (!this.secretKey) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await this.axiosInstance.post<PaystackPaymentLinkResponse>(
        '/transaction/initialize',
        {
          amount: params.amount * 100, // Convert GHC to pesewas
          email: params.email,
          reference: params.reference,
          metadata: params.metadata,
          callback_url: params.callbackUrl,
          description: params.description || 'Print Job Payment',
        }
      );

      if (response.data.status && response.data.data.authorization_url) {
        logger.info('Payment link generated successfully', {
          reference: params.reference,
          amount: params.amount,
        });
        return response.data.data.authorization_url;
      }

      throw new Error(response.data.message || 'Failed to generate payment link');
    } catch (error) {
      logger.error('Error generating Paystack payment link:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to generate payment link'
        );
      }
      throw error;
    }
  }

  /**
   * Verify a payment transaction
   */
  async verifyPayment(reference: string): Promise<{
    status: boolean;
    amount: number;
    currency: string;
    customer: { email: string };
  }> {
    try {
      if (!this.secretKey) {
        throw new Error('Paystack secret key not configured');
      }

      const response = await this.axiosInstance.get(
        `/transaction/verify/${reference}`
      );

      if (response.data.status && response.data.data.status === 'success') {
        return {
          status: true,
          amount: response.data.data.amount / 100, // Convert pesewas to GHC
          currency: response.data.data.currency,
          customer: {
            email: response.data.data.customer.email,
          },
        };
      }

      return {
        status: false,
        amount: 0,
        currency: 'GHS',
        customer: { email: '' },
      };
    } catch (error) {
      logger.error('Error verifying Paystack payment:', error);
      throw error;
    }
  }

  /**
   * Get public key for frontend use
   */
  getPublicKey(): string {
    return this.publicKey;
  }
}

export const paystackService = new PaystackService();

