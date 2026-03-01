const Message = require('../models/Message');
const Project = require('../models/Project');
const { Roles } = require('../config/global');

// @desc    Get messages for a project
// @route   GET /api/chat/:projectId/messages
// @access  Private (Project members only)
const getProjectMessages = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50, before } = req.query;
    // const userId = req.user._id;

    // Verify user has access to this project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Build query
    const query = { project: projectId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages with pagination
    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get personal messages (1-on-1)
// @route   GET /api/chat/personal/:userId
// @access  Private
const getPersonalMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id;
    const { limit = 50, before } = req.query;

    // Build query to find messages between these two users
    const query = {
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    // Fetch messages with pagination
    const messages = await Message.find(query)
      .populate('sender', 'name email role')
      .populate('receiver', 'name email role')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      messages: messages.reverse(),
      hasMore: messages.length === parseInt(limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a message (fallback for non-socket)
// @route   POST /api/chat/:projectId/messages
// @access  Private
const createMessage = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { receiverId, content, type = 'text' } = req.body;
    const userId = req.user._id;

    const messageData = {
      sender: userId,
      content,
      type
    };

    if (projectId && projectId !== 'personal') {
      // Verify project exists
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      messageData.project = projectId;
    } else if (receiverId) {
      messageData.receiver = receiverId;
    } else {
      return res.status(400).json({ message: 'Project ID or Receiver ID is required' });
    }

    // Create message
    const message = await Message.create(messageData);

    // Populate info
    await message.populate('sender', 'name email role');
    if (message.receiver) {
      await message.populate('receiver', 'name email role');
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private (Message sender or Admin)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // If it's a project message, check project manager
    let isProjectManager = false;
    if (message.project) {
      const project = await Project.findById(message.project);
      isProjectManager = project && project.manager && project.manager.toString() === userId.toString();
    }

    // Check if user is sender, super admin, or project lead
    if (message.sender.toString() !== userId.toString() &&
      userRole !== Roles.SUPER_ADMIN &&
      !isProjectManager) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Edit a message
// @route   PUT /api/chat/messages/:messageId
// @access  Private (Message sender only)
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only the sender can edit their own message
    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this message' });
    }

    // Only text messages can be edited
    if (message.type !== 'text') {
      return res.status(400).json({ message: 'Only text messages can be edited' });
    }

    message.content = content.trim();
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    await message.populate('sender', 'name email role');

    // Emit socket event for real-time update
    if (global.io) {
      const payload = {
        _id: message._id,
        content: message.content,
        isEdited: message.isEdited,
        editedAt: message.editedAt,
        project: message.project,
        receiver: message.receiver
      };
      if (message.project) {
        global.io.to(`project:${message.project}`).emit('message-edited', payload);
      } else if (message.receiver) {
        const receiverId = message.receiver.toString();
        global.io.to(`user:${receiverId}`).emit('message-edited', payload);
        global.io.to(`user:${userId.toString()}`).emit('message-edited', payload);
      }
    }

    res.json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProjectMessages,
  getPersonalMessages,
  createMessage,
  deleteMessage,
  editMessage
};
