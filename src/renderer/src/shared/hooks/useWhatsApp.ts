import { useState, useEffect, useCallback, useRef } from 'react';
import { electronAPI } from '../../../lib';

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  body: string;
  timestamp: number;
  fromMe: boolean;
  hasMedia?: boolean;
  contact?: {
    name: string;
    number: string;
  };
  ack?: number; // 0: pending, 1: sent, 2: delivered, 3: read
  isOptimistic?: boolean;
}

export interface WhatsAppChat {
  chatId: string;
  messages: WhatsAppMessage[];
  lastMessage?: WhatsAppMessage;
  lastMessageTime?: number;
  contact?: {
    name: string;
    number: string;
  };
}

/**
 * Real-time WhatsApp hook with optimistic updates and message acknowledgments
 */
export const useWhatsApp = () => {
  const [chats, setChats] = useState<Record<string, WhatsAppChat>>({});
  const [isReady, setIsReady] = useState(false);
  const optimisticMessagesRef = useRef<Map<string, string>>(new Map()); // tempId -> realId

  useEffect(() => {
    if (!electronAPI.whatsapp) {
      console.warn('WhatsApp API not available');
      return;
    }

    // Listen for WhatsApp ready event
    const unsubscribeReady = electronAPI.whatsapp.onReady(() => {
      setIsReady(true);
      console.log('✅ WhatsApp client is ready');
    });

    // Listen for incoming messages
    const unsubscribeMessage = electronAPI.whatsapp.onMessage((messageData: any) => {
      // Handle both old format and new enhanced format
      const message: WhatsAppMessage = {
        id: messageData.id || messageData.messageId || `msg_${Date.now()}`,
        chatId: messageData.chatId || messageData.from || messageData.contact,
        body: messageData.body || messageData.message?.body || '',
        timestamp: messageData.timestamp || Date.now(),
        fromMe: messageData.fromMe || false,
        hasMedia: messageData.hasMedia || messageData.message?.hasMedia,
        contact: messageData.contact || messageData.message?.contact,
        ack: messageData.ack || 0,
      };

      setChats((prev) => {
        const chatId = message.chatId;
        const existingChat = prev[chatId] || {
          chatId,
          messages: [],
          contact: message.contact,
        };

        // Check if message already exists (avoid duplicates)
        const messageExists = existingChat.messages.some((msg) => msg.id === message.id);
        if (messageExists) {
          return prev;
        }

        return {
          ...prev,
          [chatId]: {
            ...existingChat,
            messages: [...existingChat.messages, message],
            lastMessage: message,
            lastMessageTime: message.timestamp,
            contact: message.contact || existingChat.contact,
          },
        };
      });
    });

    // Listen for message acknowledgments (checkmarks)
    const unsubscribeAck = electronAPI.whatsapp.onMessageAck?.(({ messageId, chatId, ack }: { messageId: string; chatId: string; ack: number }) => {
      setChats((prev) => {
        const updatedChats = { ...prev };
        const chat = updatedChats[chatId];

        if (!chat) return prev;

        // Find and update the message with the new ack status
        const messageIndex = chat.messages.findIndex((msg) => msg.id === messageId);

        if (messageIndex !== -1) {
          const updatedMessages = [...chat.messages];
          updatedMessages[messageIndex] = {
            ...updatedMessages[messageIndex],
            ack,
            isOptimistic: false, // Real message now
          };

          return {
            ...prev,
            [chatId]: {
              ...chat,
              messages: updatedMessages,
            },
          };
        }

        return prev;
      });
    });

    // Listen for message sent events
    const unsubscribeSent = electronAPI.whatsapp.onMessageSent?.((data: { chatId: string; text: string; timestamp: number }) => {
      // This is handled by optimistic updates, but we can use it to confirm
      console.log('Message sent confirmation:', data);
    });

    return () => {
      unsubscribeReady();
      unsubscribeMessage();
      unsubscribeAck?.();
      unsubscribeSent?.();
    };
  }, []);

  const sendMessage = useCallback(
    async (chatId: string, messageText: string): Promise<WhatsAppMessage> => {
      if (!electronAPI.whatsapp) {
        throw new Error('WhatsApp API not available');
      }

      // Optimistic update - add message to UI immediately
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const optimisticMessage: WhatsAppMessage = {
        id: tempId,
        chatId,
        body: messageText,
        timestamp: Math.floor(Date.now() / 1000),
        fromMe: true,
        ack: 0, // Pending
        isOptimistic: true,
      };

      setChats((prev) => {
        const existingChat = prev[chatId] || {
          chatId,
          messages: [],
        };

        return {
          ...prev,
          [chatId]: {
            ...existingChat,
            messages: [...existingChat.messages, optimisticMessage],
            lastMessage: optimisticMessage,
            lastMessageTime: optimisticMessage.timestamp,
          },
        };
      });

      try {
        // Send actual message
        await electronAPI.whatsapp.sendMessage(chatId, messageText);

        // The message_ack event will update the message status
        // For now, mark as sent (ack: 1)
        setChats((prev) => {
          const chat = prev[chatId];
          if (!chat) return prev;

          const messageIndex = chat.messages.findIndex((msg) => msg.id === tempId);
          if (messageIndex !== -1) {
            const updatedMessages = [...chat.messages];
            updatedMessages[messageIndex] = {
              ...updatedMessages[messageIndex],
              ack: 1, // Sent
              isOptimistic: false,
            };

            return {
              ...prev,
              [chatId]: {
                ...chat,
                messages: updatedMessages,
              },
            };
          }

          return prev;
        });

        return optimisticMessage;
      } catch (error) {
        // Remove optimistic message on error
        setChats((prev) => {
          const chat = prev[chatId];
          if (!chat) return prev;

          return {
            ...prev,
            [chatId]: {
              ...chat,
              messages: chat.messages.filter((msg) => msg.id !== tempId),
            },
          };
        });

        throw error;
      }
    },
    []
  );

  return { chats, isReady, sendMessage };
};

