const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/config');
const User = require('../models/User');
const Message = require('../models/Message');

// Store active users per project
const activeUsers = new Map(); // projectId -> Set of { userId, socketId, userName }

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(async(socket, next) => {
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
    console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);

    // Join a project chat room
    socket.on('join-project', (projectId) => {
      socket.join(`project:${projectId}`);

      // Track active user
      if (!activeUsers.has(projectId)) {
        activeUsers.set(projectId, new Set());
      }

      const projectUsers = activeUsers.get(projectId);
      projectUsers.add({
        userId: socket.user._id.toString(),
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

    // Send a message
    socket.on('send-message', async({ projectId, content }) => {
      try {
        // Save message to database
        const message = await Message.create({
          project: projectId,
          sender: socket.user._id,
          content,
          type: 'text'
        });

        // Populate sender info
        await message.populate('sender', 'name email role');

        // Broadcast to all users in the project room
        io.to(`project:${projectId}`).emit('new-message', {
          _id: message._id,
          project: message.project,
          sender: {
            _id: message.sender._id,
            name: message.sender.name,
            email: message.sender.email,
            role: message.sender.role
          },
          content: message.content,
          type: message.type,
          createdAt: message.createdAt,
          updatedAt: message.updatedAt
        });

        console.log(`💬 Message sent in project ${projectId} by ${socket.user.name}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('message-error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', ({ projectId }) => {
      socket.to(`project:${projectId}`).emit('user-typing', {
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    // Stop typing indicator
    socket.on('stop-typing', ({ projectId }) => {
      socket.to(`project:${projectId}`).emit('user-stop-typing', {
        userId: socket.user._id
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);

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

module.exports = { initializeSocket };
