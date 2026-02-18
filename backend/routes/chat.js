const express = require('express');
const router = express.Router();
const { getProjectMessages, createMessage, deleteMessage } = require('../controllers/ChatController');
const { authenticate } = require('../helpers/auth');

// All chat routes require authentication
router.use(authenticate);

router.get('/:projectId/messages', getProjectMessages);
router.post('/:projectId/messages', createMessage);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
