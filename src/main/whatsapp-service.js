// src/main/whatsapp-service.js
// Separate Node.js process for WhatsApp Web.js to avoid bundling issues

const { Client, LocalAuth } = require('whatsapp-web.js');
const path = require('path');
const fs = require('fs');

let client = null;
let userDataPath = null;

// Get user data path for session storage
function getUserDataPath() {
  if (userDataPath) {
    return userDataPath;
  }
  
  // In a forked process, we need to get the path differently
  // The parent process should pass this via environment or message
  userDataPath = process.env.USER_DATA_PATH || 
    (process.platform === 'win32' 
      ? path.join(process.env.APPDATA || process.env.USERPROFILE, 'printmyfile-agent')
      : process.platform === 'darwin'
      ? path.join(process.env.HOME, 'Library', 'Application Support', 'printmyfile-agent')
      : path.join(process.env.HOME, '.config', 'printmyfile-agent'));
  
  return userDataPath;
}

process.on('message', async (msg) => {
  try {
    switch (msg.type) {
      case 'init':
        await initializeWhatsApp(msg.userDataPath);
        break;
      case 'send-message':
        await sendMessage(msg.chatId, msg.text);
        break;
      case 'send-file':
        await sendFile(msg.chatId, msg.filePath, msg.caption);
        break;
      case 'disconnect':
        await disconnect();
        break;
      case 'logout':
        await logout();
        break;
    }
  } catch (error) {
    process.send({ 
      type: 'error', 
      error: error.message || 'Unknown error' 
    });
  }
});

async function initializeWhatsApp(providedUserDataPath) {
  try {
    if (client) {
      process.send({ type: 'already-initialized' });
      return;
    }

    // Use provided path or get default
    if (providedUserDataPath) {
      userDataPath = providedUserDataPath;
    }

    const sessionPath = path.join(getUserDataPath(), '.wwebjs_auth');

    // Ensure session directory exists
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    client = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
        ],
      },
    });

    client.on('qr', (qr) => {
      console.log('QR code received');
      process.send({ type: 'qr', qr });
    });

    client.on('authenticated', () => {
      console.log('WhatsApp authenticated');
      process.send({ type: 'authenticated' });
    });

    client.on('ready', async () => {
      console.log('WhatsApp client is ready!');
      
      try {
        const info = client.info;
        process.send({ 
          type: 'ready',
          clientInfo: {
            pushname: info.pushname || 'Unknown',
            platform: info.platform || 'Unknown',
            number: info.wid?.user || 'Unknown',
            phoneNumber: info.wid?.user || undefined,
          }
        });
        
        // Fetch recent messages that may have been missed while offline
        await fetchRecentMessages();
      } catch (error) {
        console.error('Error getting client info:', error);
        process.send({ type: 'ready' });
      }
    });

    client.on('message', async (message) => {
      try {
        console.log('Received WhatsApp message event', {
          from: message.from,
          hasMedia: message.hasMedia,
          body: message.body?.substring(0, 50),
          isGroup: message.from?.includes('@g.us'),
        });

        // Process new messages (not historical)
        await processMessage(message, false);
        
        // Handle /print command - send auto-reply (only for new messages, not historical)
        // Client can send /print with details and files in one message
        const messageBody = message.body || '';
        const isPrintCommand = messageBody.trim().toLowerCase().startsWith('/print');
        if (isPrintCommand) {
          try {
            await message.reply('Your order has been received and is being processed. We will get back to you shortly with a quote.');
            console.log('Sent auto-reply for /print command');
          } catch (error) {
            console.error('Error sending auto-reply:', error);
          }
        }
      } catch (error) {
        console.error('Error processing message:', error);
        console.error('Error stack:', error.stack);
      }
    });

    client.on('disconnected', (reason) => {
      console.log('WhatsApp disconnected:', reason);
      process.send({ type: 'disconnected', reason });
      client = null;
    });

    client.on('auth_failure', (message) => {
      console.error('Authentication failure:', message);
      process.send({ type: 'error', error: 'Authentication failed: ' + message });
    });

    await client.initialize();
    process.send({ type: 'initializing' });
  } catch (error) {
    console.error('Failed to initialize WhatsApp:', error);
    process.send({ type: 'error', error: error.message || 'Failed to initialize' });
  }
}

/**
 * Fetch recent messages that may have been missed while offline
 * Fetches messages from the last 24 hours or last 50 messages per chat
 */
async function fetchRecentMessages() {
  if (!client) {
    console.log('Client not initialized, skipping message history fetch');
    return;
  }

  try {
    console.log('Fetching recent messages that may have been missed...');
    const chats = await client.getChats();
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago
    let totalFetched = 0;

    for (const chat of chats) {
      // Skip group chats
      if (chat.id._serialized.includes('@g.us')) {
        continue;
      }

      try {
        // Fetch recent messages (last 50 messages or from last 24 hours)
        const messages = await chat.fetchMessages({ limit: 50 });
        
        for (const message of messages) {
          // Only process messages from the last 24 hours
          const messageTime = message.timestamp * 1000; // Convert to milliseconds
          if (messageTime < oneDayAgo) {
            continue;
          }

          // Skip status broadcasts
          if (message.from === 'status@broadcast') {
            continue;
          }

          // Process the message the same way as new messages
          await processMessage(message, true); // true = isHistorical
          totalFetched++;
        }
      } catch (chatError) {
        console.error(`Error fetching messages from chat ${chat.id._serialized}:`, chatError.message);
        // Continue with other chats
      }
    }

    console.log(`Finished fetching recent messages. Processed ${totalFetched} messages.`);
    process.send({ type: 'message-history-fetched', count: totalFetched });
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    // Don't fail the connection if history fetch fails
  }
}

/**
 * Process a message (used for both new and historical messages)
 */
async function processMessage(message, isHistorical = false) {
  try {
    // Skip messages from groups or status
    if (message.from === 'status@broadcast') {
      return;
    }
    
    if (message.from.includes('@g.us')) {
      return;
    }

    // Try to get contact info
    let contactName = message.from;
    let contactNumber = message.from.split('@')[0];
    
    try {
      const contact = await message.getContact();
      if (contact) {
        contactName = contact.pushname || contact.name || contactNumber;
        contactNumber = contact.number || contactNumber;
      }
    } catch (contactError) {
      if (message.notifyName) {
        contactName = message.notifyName;
      }
    }
    
    const messageBody = message.body || '';
    const isPrintCommand = messageBody.trim().toLowerCase().startsWith('/print');
    
    const messageData = {
      from: message.from,
      body: messageBody,
      timestamp: message.timestamp,
      hasMedia: message.hasMedia,
      contactName: contactName,
      contactNumber: contactNumber,
      messageId: message.id._serialized,
      isPrintCommand: isPrintCommand,
      isHistorical: isHistorical, // Flag to indicate this is a historical message
    };

    if (message.hasMedia) {
      try {
        const media = await message.downloadMedia();
        messageData.media = {
          mimetype: media.mimetype,
          data: media.data,
          filename: media.filename || 'file'
        };
      } catch (error) {
        console.error('Error downloading media:', error);
      }
    }

    // Only log for non-historical messages to reduce noise
    if (!isHistorical) {
      console.log('[whatsapp-service] Sending new message to main process:', {
        from: messageData.from,
        body: messageData.body?.substring(0, 50),
        isPrintCommand: messageData.isPrintCommand,
      });
    }
    
    process.send({ type: 'message', data: messageData });
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

async function sendMessage(chatId, text) {
  if (!client) {
    process.send({ type: 'error', error: 'Client not initialized' });
    return;
  }

  try {
    await client.sendMessage(chatId, text);
    process.send({ type: 'message-sent', chatId, text });
  } catch (error) {
    console.error('Error sending message:', error);
    process.send({ type: 'error', error: error.message || 'Failed to send message' });
  }
}

async function sendFile(chatId, filePath, caption) {
  if (!client) {
    process.send({ type: 'error', error: 'Client not initialized' });
    return;
  }

  try {
    const { MessageMedia } = require('whatsapp-web.js');
    const fs = require('fs');
    const path = require('path');

    // Read file and create MessageMedia
    const fileBuffer = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    // Determine MIME type from file extension
    let mimeType = 'application/octet-stream';
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.mkv': 'video/x-matroska',
    };
    mimeType = mimeTypes[ext] || mimeType;
    
    const base64File = fileBuffer.toString('base64');
    const media = new MessageMedia(mimeType, base64File, fileName);

    // Send file with optional caption
    await client.sendMessage(chatId, media, { caption: caption || '' });
    process.send({ type: 'file-sent', chatId, filePath, fileName });
  } catch (error) {
    console.error('Error sending file:', error);
    process.send({ type: 'error', error: error.message || 'Failed to send file' });
  }
}

async function disconnect() {
  if (client) {
    try {
      await client.destroy();
      client = null;
      process.send({ type: 'disconnected', reason: 'User requested' });
    } catch (error) {
      console.error('Error disconnecting:', error);
      process.send({ type: 'error', error: error.message });
    }
  }
}

async function logout() {
  if (client) {
    try {
      await client.logout();
      await disconnect();
      process.send({ type: 'logged-out' });
    } catch (error) {
      console.error('Error logging out:', error);
      process.send({ type: 'error', error: error.message });
    }
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  if (client) {
    await client.destroy();
  }
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in WhatsApp service:', error);
  process.send({ type: 'error', error: error.message || 'Uncaught exception' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in WhatsApp service:', reason);
  process.send({ type: 'error', error: String(reason) || 'Unhandled rejection' });
});

console.log('WhatsApp service process started');

