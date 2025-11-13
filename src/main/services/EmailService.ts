import transport from '../config/mailer';
import { logger } from '../utils/logger';

interface ClerkWelcomeEmailData {
  name: string;
  email: string;
  password: string;
}

/**
 * Generates HTML email template for clerk welcome email
 */
function generateClerkWelcomeEmailTemplate(data: ClerkWelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Printer Agent</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color:rgb(226, 137, 21);
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .credentials-box {
            background-color: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials-box h3 {
            margin-top: 0;
            color: #495057;
            font-size: 16px;
        }
        .credential-item {
            margin: 10px 0;
        }
        .credential-label {
            font-weight: 600;
            color: #6c757d;
            display: inline-block;
            width: 100px;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            display: inline-block;
            color: #212529;
        }
        .password-warning {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .password-warning strong {
            color: #856404;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Print Station</h1>
        </div>
        <div class="content">
            <p>Hello ${data.name},</p>
            <p>Your clerk account has been successfully created. You can now sign in to the Printer Agent application using the credentials below:</p>
            
            <div class="credentials-box">
                <h3>Your Login Credentials</h3>
                <div class="credential-item">
                    <span class="credential-label">Email:</span>
                    <span class="credential-value">${data.email}</span>
                </div>
                <div class="credential-item">
                    <span class="credential-label">Password:</span>
                    <span class="credential-value">${data.password}</span>
                </div>
            </div>
            
            <div class="password-warning">
                <strong>Important:</strong> This is a temporary password. Please change it after your first login for security purposes.
            </div>
            
            <p>If you have any questions or need assistance, please contact your administrator.</p>
        </div>
        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();
}

/**
 * Sends welcome email to a newly created clerk with their temporary password
 */
export async function sendClerkWelcomeEmail(data: ClerkWelcomeEmailData): Promise<void> {
  try {
    const emailHtml = generateClerkWelcomeEmailTemplate(data);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: data.email,
      subject: 'Welcome to Printer Agent - Your Account Credentials',
      html: emailHtml,
    };

    const info = await transport.sendMail(mailOptions);
    logger.info('Clerk welcome email sent successfully', {
      to: data.email,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error('Failed to send clerk welcome email', {
      to: data.email,
      error: error instanceof Error ? error.message : String(error),
    });
    // Don't throw - email failure shouldn't prevent user creation
    // But log it so we know about the issue
  }
}

