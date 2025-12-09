import { logger } from '../../utils/logger';
import { apiService, PAYMENT_LINK_BASE_URL } from '../api';
import type { PrintJob } from '../../types';

export interface QuoteData {
  orderDescription: string;
  quantity?: string;
  specifications: string;
  price: number;
  internalNotes?: string;
  contact: string;
  email: string;
}

export class WhatsAppQuoteHandler {
  /**
   * Extract ID from various formats
   */
  private extractId(obj: unknown): string {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    const objAny = obj as Record<string, unknown>;
    if (objAny._id) return String(objAny._id);
    if (objAny.id) return String(objAny.id);
    if (typeof objAny.toString === 'function') return String(objAny.toString());
    return '';
  }

  /**
   * Check if string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(String(id).trim());
  }

  /**
   * Get admin ID from current user profile
   */
  private async getAdminId(): Promise<string> {
    try {
      const currentUser = await apiService.getProfile();
      const adminId = this.extractId((currentUser as Record<string, unknown>).id || (currentUser as Record<string, unknown>)._id);
      if (!adminId) {
        throw new Error('User ID not found. Please ensure you are logged in.');
      }
      logger.info('Retrieved user ID from profile', { adminId });
      return adminId;
    } catch (profileError: unknown) {
      const error = profileError as Error;
      logger.error('Error getting user profile for quote creation', error);
      throw new Error(`Failed to get user profile: ${error.message || 'Unknown error'}. Please ensure you are logged in.`);
    }
  }

  /**
   * Get category ID from job or use first available category
   */
  private async getCategoryId(adminId: string, jobId?: string): Promise<string> {
    // Try to get categoryId from job if it's a valid ObjectId
    if (jobId && this.isValidObjectId(jobId)) {
      try {
        logger.info('Fetching API job for categoryId', { jobId });
        const job = await apiService.getJob(jobId);
        if (job) {
          const jobAny = job as Record<string, unknown>;
          const jobCategoryId = this.extractId(jobAny.categoryId);
          if (jobCategoryId && jobCategoryId.trim()) {
            logger.info('Using categoryId from job', { categoryId: jobCategoryId });
            return jobCategoryId.trim();
          }
        }
      } catch (jobError: unknown) {
        const error = jobError as Error;
        logger.warn('Could not fetch job for categoryId, will use first available category', {
          error: error.message,
        });
      }
    }

    // Get first available category
    try {
      const categories = await apiService.getCategories(adminId);
      if (categories.length === 0) {
        throw new Error('No categories found. Please create a category first.');
      }
      const categoryId = this.extractId((categories[0] as Record<string, unknown>).id || (categories[0] as Record<string, unknown>)._id);
      logger.info('Using first available category', {
        categoryId,
        categoryName: (categories[0] as Record<string, unknown>).name,
      });
      return categoryId;
    } catch (categoryError: unknown) {
      const error = categoryError as Error;
      logger.error('Error getting categories', error);
      throw new Error(`Failed to get categories: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Validate quote data
   */
  private validateQuoteData(
    adminId: string,
    categoryId: string,
    quoteData: QuoteData
  ): void {
    if (!adminId || adminId.trim() === '') {
      throw new Error('Admin ID is required but was not found or is empty');
    }
    if (!categoryId || categoryId.trim() === '') {
      throw new Error('Category ID is required but was not found or is empty');
    }
    if (!quoteData.specifications || quoteData.specifications.trim() === '') {
      throw new Error('Specifications are required');
    }
    if (!quoteData.price || isNaN(quoteData.price) || quoteData.price <= 0) {
      throw new Error(`Invalid price: ${quoteData.price}. Price must be a positive number.`);
    }
  }

  /**
   * Update job with quote information
   */
  private async updateJobWithQuote(
    jobId: string,
    quoteData: QuoteData,
    quoteJobId: string,
    quoteConfirmationLink: string
  ): Promise<void> {
    if (!this.isValidObjectId(jobId)) {
      logger.info('Quote created for local conversation - status will update on next refresh', {
        jobId,
        quoteJobId,
      });
      return;
    }

    try {
      const job = await apiService.getJob(jobId);
      if (!job) {
        return;
      }

      const jobAny = job as Record<string, unknown>;
      const updatedMetadata = {
        ...((jobAny.metadata as Record<string, unknown>) || {}),
        orderDescription: quoteData.orderDescription,
        specifications: quoteData.specifications,
        quantity: quoteData.quantity,
        total: quoteData.price,
        paymentLink: quoteConfirmationLink,
        quoteJobId: quoteJobId,
        internalNotes: quoteData.internalNotes,
        conversationStatus: 'quote_sent',
      };

      await apiService.updateJob(jobId, {
        status: 'quote_sent',
        description: quoteData.orderDescription,
        metadata: updatedMetadata as PrintJob['metadata'],
      });
    } catch (error) {
      logger.error('Error updating job with quote information:', error);
    }
  }

  /**
   * Format WhatsApp message for quote
   */
  formatQuoteMessage(quoteData: QuoteData, paymentLink: string): string {
    return `📋 *Your Print Order Quote*\n\n` +
      `*Order Description:*\n${quoteData.orderDescription}\n\n` +
      (quoteData.quantity ? `*Quantity:* ${quoteData.quantity}\n\n` : '') +
      `*Specifications:*\n${quoteData.specifications}\n\n` +
      `*Total Price:* GHC ${quoteData.price.toFixed(2)}\n\n` +
      `💳 *Payment Link:*\n${paymentLink}\n\n` +
      `Please click the link above to review and confirm your payment. Once payment is confirmed, we'll start processing your order! 🚀`;
  }

  /**
   * Create a quote and return payment link
   */
  async createQuote(
    jobId: string,
    quoteData: QuoteData,
    sendMessageCallback: (contact: string, message: string) => Promise<{ success: boolean }>
  ): Promise<{ success: boolean; paymentLink: string }> {
    try {
      // Get admin and category IDs
      const adminId = await this.getAdminId();
      const categoryId = await this.getCategoryId(adminId, jobId);

      // Validate quote data
      this.validateQuoteData(adminId, categoryId, quoteData);

      // Create quote payload
      const quotePayload = {
        adminId: adminId.trim(),
        categoryId: categoryId.trim(),
        orderDescription: quoteData.orderDescription || 'Print order',
        quantity: quoteData.quantity,
        specifications: quoteData.specifications.trim(),
        totalPrice: Number(quoteData.price),
        internalNotes: quoteData.internalNotes,
      };

      logger.info('Creating quote with payload:', {
        ...quotePayload,
        totalPrice: quotePayload.totalPrice,
        totalPriceType: typeof quotePayload.totalPrice,
        adminIdLength: adminId.length,
        categoryIdLength: categoryId.length,
        specificationsLength: quotePayload.specifications.length,
      });

      // Create quote via API
      const createdQuote = await apiService.createQuote(quotePayload);
      const quoteJobId = this.extractId(createdQuote.id || createdQuote._id);

      // Build payment link
      const quoteConfirmationLink = `${PAYMENT_LINK_BASE_URL}/quote/confirm?jobId=${quoteJobId}`;

      // Update original job with quote information
      await this.updateJobWithQuote(jobId, quoteData, quoteJobId, quoteConfirmationLink);

      // Send WhatsApp message to client
      const whatsappMessage = this.formatQuoteMessage(quoteData, quoteConfirmationLink);
      await sendMessageCallback(quoteData.contact, whatsappMessage);

      logger.info('Quote created and sent to client', {
        originalJobId: jobId,
        quoteJobId: quoteJobId,
        contact: quoteData.contact,
        price: quoteData.price,
        quoteLink: quoteConfirmationLink,
      });

      return { success: true, paymentLink: quoteConfirmationLink };
    } catch (error) {
      logger.error('Error creating quote:', error);
      throw error;
    }
  }
}

