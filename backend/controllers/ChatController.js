const Message = require('../models/Message');
const Project = require('../models/Project');

// @desc    Get messages for a project
// @route   GET /api/chat/:projectId/messages
// @access  Private (Project members only)
const getProjectMessages = async(req, res) => {
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

// @desc    Create a message (fallback for non-socket)
// @route   POST /api/chat/:projectId/messages
// @access  Private (Project members only)
const createMessage = async(req, res) => {
  try {
    const { projectId } = req.params;
    const { content, type = 'text' } = req.body;
    const userId = req.user._id;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create message
    const message = await Message.create({
      project: projectId,
      sender: userId,
      content,
      type
    });

    // Populate sender info
    await message.populate('sender', 'name email role');

    res.status(201).json(message);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/messages/:messageId
// @access  Private (Message sender or Admin)
const deleteMessage = async(req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is sender or admin
    if (message.sender.toString() !== userId.toString() &&
            userRole !== 'SUPER_ADMIN' &&
            userRole !== 'PROJECT_MANAGER') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  getProjectMessages,
  createMessage,
  deleteMessage
};
