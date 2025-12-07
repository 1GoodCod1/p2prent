import { Server } from 'socket.io';
import { prisma } from '../config/database.js';
import logger from '../config/logger.js';

export class ChatWebSocket {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    this.userSockets = new Map(); // userId -> socketId
    this.socketUsers = new Map(); // socketId -> userId

    this.setupEvents();
  }

  setupEvents() {
    this.io.on('connection', (socket) => {
      logger.info(`Socket connected: ${socket.id}`);

      // Authenticate user
      socket.on('authenticate', async (token) => {
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true, status: true },
          });

          if (!user || user.status !== 'ACTIVE') {
            socket.emit('authentication_error', 'Invalid token');
            return;
          }

          // Store user-socket mapping
          this.userSockets.set(user.id, socket.id);
          this.socketUsers.set(socket.id, user.id);

          // Join user's personal room
          socket.join(`user_${user.id}`);

          // Notify user about successful connection
          socket.emit('authenticated', { userId: user.id });

          // Notify user about unread messages
          await this.notifyUnreadMessages(user.id, socket);

          logger.info(`User ${user.id} authenticated on socket ${socket.id}`);
        } catch (error) {
          logger.error('Socket authentication error:', error);
          socket.emit('authentication_error', 'Authentication failed');
        }
      });

      // Send message
      socket.on('send_message', async (data) => {
        try {
          const { receiverId, rentalId, content } = data;
          const senderId = this.socketUsers.get(socket.id);

          if (!senderId) {
            socket.emit('error', 'Not authenticated');
            return;
          }

          // Validate receiver
          const receiver = await prisma.user.findUnique({
            where: { id: receiverId },
            select: { id: true, status: true },
          });

          if (!receiver || receiver.status !== 'ACTIVE') {
            socket.emit('error', 'Receiver not found or inactive');
            return;
          }

          // Validate rental if provided
          if (rentalId) {
            const rental = await prisma.rental.findUnique({
              where: { id: rentalId },
              select: { renterId: true, ownerId: true },
            });

            if (!rental || (rental.renterId !== senderId && rental.ownerId !== senderId)) {
              socket.emit('error', 'Invalid rental or no permission');
              return;
            }
          }

          // Create message
          const message = await prisma.message.create({
            data: {
              senderId,
              receiverId,
              rentalId,
              content,
            },
            include: {
              sender: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          });

          // Emit to sender
          socket.emit('message_sent', message);

          // Emit to receiver if online
          const receiverSocketId = this.userSockets.get(receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('new_message', message);
          }

          // Also send to rental room if rentalId exists
          if (rentalId) {
            this.io.to(`rental_${rentalId}`).emit('new_rental_message', {
              message,
              rentalId,
            });
          }

          logger.info(`Message sent from ${senderId} to ${receiverId}`);
        } catch (error) {
          logger.error('Send message error:', error);
          socket.emit('error', 'Failed to send message');
        }
      });

      // Join rental chat room
      socket.on('join_rental_chat', (rentalId) => {
        socket.join(`rental_${rentalId}`);
        logger.info(`Socket ${socket.id} joined rental chat ${rentalId}`);
      });

      // Leave rental chat room
      socket.on('leave_rental_chat', (rentalId) => {
        socket.leave(`rental_${rentalId}`);
        logger.info(`Socket ${socket.id} left rental chat ${rentalId}`);
      });

      // Mark message as read
      socket.on('mark_as_read', async (messageId) => {
        try {
          const userId = this.socketUsers.get(socket.id);
          if (!userId) return;

          const message = await prisma.message.findUnique({
            where: { id: messageId },
            select: { receiverId: true },
          });

          if (!message || message.receiverId !== userId) {
            return;
          }

          await prisma.message.update({
            where: { id: messageId },
            data: {
              isRead: true,
              readAt: new Date(),
            },
          });

          // Notify sender that message was read
          const updatedMessage = await prisma.message.findUnique({
            where: { id: messageId },
            include: {
              sender: {
                select: {
                  id: true,
                },
              },
            },
          });

          const senderSocketId = this.userSockets.get(updatedMessage.sender.id);
          if (senderSocketId) {
            this.io.to(senderSocketId).emit('message_read', { messageId });
          }

          logger.info(`Message ${messageId} marked as read by ${userId}`);
        } catch (error) {
          logger.error('Mark as read error:', error);
        }
      });

      // Typing indicator
      socket.on('typing', (data) => {
        const { receiverId, rentalId, isTyping } = data;
        const senderId = this.socketUsers.get(socket.id);

        if (!senderId) return;

        const receiverSocketId = this.userSockets.get(receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('user_typing', {
            senderId,
            rentalId,
            isTyping,
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        const userId = this.socketUsers.get(socket.id);
        if (userId) {
          this.userSockets.delete(userId);
          this.socketUsers.delete(socket.id);
          logger.info(`User ${userId} disconnected from socket ${socket.id}`);
        }
      });
    });
  }

  async notifyUnreadMessages(userId, socket) {
    try {
      const unreadMessages = await prisma.message.findMany({
        where: {
          receiverId: userId,
          isRead: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          rental: {
            select: {
              id: true,
              product: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (unreadMessages.length > 0) {
        socket.emit('unread_messages', unreadMessages);
        logger.info(`Sent ${unreadMessages.length} unread messages to user ${userId}`);
      }
    } catch (error) {
      logger.error('Error notifying unread messages:', error);
    }
  }

  // Utility method to send notification to user
  sendToUser(userId, event, data) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  // Broadcast to all connected users
  broadcast(event, data) {
    this.io.emit(event, data);
  }

  // Send to specific room
  sendToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }
}

export default  new ChatWebSocket();