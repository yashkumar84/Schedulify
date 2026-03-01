const express = require('express');
const router = express.Router();
const { getProjectMessages, getPersonalMessages, createMessage, deleteMessage, editMessage } = require('../controllers/ChatController');
const { authenticate } = require('../helpers/auth');

// All chat routes require authentication
router.use(authenticate);

router.get('/:projectId/messages', getProjectMessages);
router.get('/personal/:userId', getPersonalMessages);
router.post('/:projectId/messages', createMessage);
router.post('/messages', createMessage);
router.put('/messages/:messageId', editMessage);
router.delete('/messages/:messageId', deleteMessage);

module.exports = router;
