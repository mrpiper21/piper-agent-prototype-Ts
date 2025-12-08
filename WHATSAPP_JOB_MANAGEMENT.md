# WhatsApp Job Management System

## Overview

This system implements a manual WhatsApp job management workflow for the print agent desktop app. It allows agents to receive print requests via WhatsApp, create quotes manually, send payment links, and manage the entire job lifecycle.

## Workflow

### 1. Client Initiation

- Client sends `/print` command via WhatsApp
- System automatically replies: "Hi! Please describe what you need printed."
- Client describes their order in natural language

### 2. Agent Receives Request

- Desktop app shows incoming WhatsApp message in conversations list
- Message is flagged as **"Needs Quote"** status
- Agent can view full conversation history with client

### 3. Agent Creates Quote

- Agent clicks **"Create Quote"** button for the conversation
- Opens a form with fields:
  - **Order Description** (textarea - what client requested)
  - **Quantity** (optional text field)
  - **Specifications** (textarea - paper type, size, color, finishing, etc.)
  - **Price** (number input - agent manually calculates and enters total)
  - **Internal Notes** (optional - for agent's reference)
- Agent fills out all details and clicks **"Send Quote & Payment Link"**

### 4. Generate Payment Link

- System generates Paystack payment link with the manually entered price
- System automatically sends WhatsApp message to client with:
  - Order summary
  - All specifications
  - Total price
  - Clickable Paystack payment link
  - Message formatted professionally with emojis
- Conversation status changes to **"Quote Sent"**

### 5. Payment Notification

- When client completes payment via Paystack, webhook triggers
- Desktop app receives payment confirmation notification
- Conversation status changes to **"Payment Received"**
- System sends automatic WhatsApp confirmation to client: "Payment received! We'll start your order now."
- Job appears in agent's active jobs queue

### 6. Job Completion

- Agent completes the print job
- Agent clicks **"Mark as Complete"** button
- System sends WhatsApp message to client: "Your order is ready! [Job details]"
- Conversation status changes to **"Completed"**
- Optional: Agent can add custom completion message

## Status Flow

```
needs_quote → quote_sent → payment_received → completed
```

## Setup Instructions

### 1. Paystack Configuration

Add your Paystack keys to environment variables:

```bash
# In your .env file or environment
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

### 2. Webhook Configuration

Configure Paystack webhook to point to your backend API endpoint that handles payment notifications. The backend should then call the desktop app's webhook handler via IPC or HTTP.

**Webhook URL Format:**
```
https://your-backend-api.com/api/webhooks/paystack
```

**Webhook Events to Subscribe:**
- `charge.success` - When payment is successful

### 3. Backend Integration

Your backend API should:
1. Receive Paystack webhook events
2. Verify the webhook signature
3. Call the desktop app's webhook handler (if using IPC) or forward the event

Example backend webhook handler:

```typescript
// Backend API webhook handler
app.post('/api/webhooks/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  const event = req.body;
  
  // Verify signature
  // ... verification logic ...
  
  // Forward to desktop app (if using HTTP endpoint)
  // Or handle directly if backend manages jobs
});
```

## Components

### Frontend Components

- **`QuoteForm.tsx`** - Modal form for creating quotes
- **`WhatsAppJobDetails.tsx`** - Updated with quote creation and job completion actions
- **`WhatsAppConversationList.tsx`** - Shows conversation status badges

### Backend Services

- **`PaystackService.ts`** - Handles payment link generation and verification
- **`PaystackWebhookHandler.ts`** - Processes Paystack webhook events
- **`WhatsAppService.ts`** - Updated with quote creation and job completion methods

## API Methods

### IPC Handlers

- `whatsapp:createQuote` - Create a quote and send payment link
- `whatsapp:markJobCompleted` - Mark job as completed and notify client
- `whatsapp:handlePaymentWebhook` - Handle payment webhook from Paystack

## Status Values

- `needs_quote` - Initial status when client sends /print or order description
- `quote_sent` - Quote has been sent to client, awaiting payment
- `payment_received` - Payment confirmed, job in progress
- `completed` - Job completed and client notified

## Testing

1. Send `/print` command via WhatsApp
2. Verify auto-reply is sent
3. Check that job appears with "Needs Quote" status
4. Create a quote and verify payment link is generated
5. Test payment webhook (use Paystack test mode)
6. Verify status updates and WhatsApp notifications

## Notes

- The system prevents duplicate jobs for the same contact
- Payment links are generated with unique references
- All WhatsApp messages are formatted with emojis for better UX
- Internal notes are only visible to agents, not sent to clients

