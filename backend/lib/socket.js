const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const User = require('../models/User');
const Message = require('../models/Message');

// Store active users per project
const activeUsers = new Map(); // projectId -> Set of { userId, socketId, userName }
// Map of userId -> socketId for targeted notifications
const userSockets = new Map();

const initializeSocket = (io) => {
  // Attach io to global for controller access (optional but useful)
  global.io = io;

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      console.log(error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

    // Store user socket mapping
    userSockets.set(userId, socket.id);

    // Join a personal room for targeted notifications
    socket.join(`user:${userId}`);

    // Join a project chat room
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);

      // Track active user
      if (!activeUsers.has(projectId)) {
        activeUsers.set(projectId, new Set());
      }

      const projectUsers = activeUsers.get(projectId);
      projectUsers.add({
        userId,
        socketId: socket.id,
        userName: socket.user.name,
        userRole: socket.user.role
      });

      // Notify others that user joined
      socket.to(`project:${projectId}`).emit('user-joined', {
        userId: socket.user._id,
        userName: socket.user.name,
        userRole: socket.user.role
      });

      // Send current online users to the joining user
      const onlineUsers = Array.from(projectUsers).map(u => ({
        userId: u.userId,
        userName: u.userName,
        userRole: u.userRole
      }));
      socket.emit('online-users', onlineUsers);

      console.log(`👥 ${socket.user.name} joined project ${projectId}`);
    });

    // Leave a project chat room
    socket.on('leave-project', (projectId) => {
      socket.leave(`project:${projectId}`);

      // Remove from active users
      if (activeUsers.has(projectId)) {
        const projectUsers = activeUsers.get(projectId);
        projectUsers.forEach(u => {
          if (u.socketId === socket.id) {
            projectUsers.delete(u);
          }
        });
      }

      // Notify others that user left
      socket.to(`project:${projectId}`).emit('user-left', {
        userId: socket.user._id,
        userName: socket.user.name
      });

      console.log(`👋 ${socket.user.name} left project ${projectId}`);
    });

    // Send a message (Project or Personal)
    socket.on('send-message', async ({ projectId, receiverId, content, type = 'text', metadata = null }) => {
      try {
        const messageData = {
          sender: socket.user._id,
          content,
          type,
          metadata
        };

        if (projectId && projectId !== 'personal') {
          messageData.project = projectId;
        } else if (receiverId) {
          messageData.receiver = receiverId;
        } else {
          return socket.emit('message-error', { message: 'Project ID or Receiver ID is required' });
        }

        // Save message to database
        const message = await Message.create(messageData);

        // Populate sender info
        await message.populate('sender', 'name email role');
        if (message.receiver) {
          await message.populate('receiver', 'name email role');
        }

        const messagePayload = {
          _id: message._id,
          project: message.project,
          receiver: message.receiver,
          sender: {
            _id: message.sender._id,
            name: message.sender.name,
            email: message.sender.email,
            role: message.sender.role
          },
          content: message.content,
          type: message.type,
          metadata: message.metadata,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        };

        if (message.project) {
          // Broadcast to all users in the project room
          io.to(`project:${message.project}`).emit('new-message', messagePayload);
          console.log(`💬 ${message.type} message sent in project ${message.project} by ${socket.user.name}`);
        } else if (message.receiver) {
          // Send to receiver's room and sender's room
          const receiverIdStr = message.receiver._id.toString();
          io.to(`user:${receiverIdStr}`).emit('new-message', messagePayload);
          io.to(`user:${userId}`).emit('new-message', messagePayload);
          console.log(`👤 Personal message sent from ${socket.user.name} to ${receiverIdStr}`);
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ projectId, receiverId }) => {
      if (projectId) {
        socket.to(`project:${projectId}`).emit('user-typing', {
          userId: socket.user._id,
          userName: socket.user.name
        });
      } else if (receiverId) {
        socket.to(`user:${receiverId}`).emit('user-typing', {
          userId: socket.user._id,
          userName: socket.user.name,
          isPersonal: true
        });
      }
    });

    // Stop typing indicator
    socket.on('stop-typing', ({ projectId, receiverId }) => {
      if (projectId) {
        socket.to(`project:${projectId}`).emit('user-stop-typing', {
          userId: socket.user._id
        });
      } else if (receiverId) {
        socket.to(`user:${receiverId}`).emit('user-stop-typing', {
          userId: socket.user._id,
          isPersonal: true
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);

      // Remove user socket mapping
      userSockets.delete(userId);

      // Remove from all active projects
      activeUsers.forEach((projectUsers, projectId) => {
        projectUsers.forEach(u => {
          if (u.socketId === socket.id) {
            projectUsers.delete(u);

            // Notify others
            socket.to(`project:${projectId}`).emit('user-left', {
              userId: socket.user._id,
              userName: socket.user.name
            });
          }
        });
      });
    });
  });
};

/**
 * Send real-time notification to a user
 */
const sendNotification = (recipientId, notificationData) => {
  if (global.io) {
    global.io.to(`user:${recipientId}`).emit('new-notification', notificationData);
  }
};

module.exports = { initializeSocket, sendNotification };
