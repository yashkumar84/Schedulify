const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['TASK_STATUS_CHANGE', 'TASK_ASSIGNMENT', 'PROJECT_ASSIGNMENT', 'TASK_COMMENT', 'SYSTEM'],
    default: 'SYSTEM'
  },
  message: {
    type: String,
    required: true
  },
  link: {
    type: String // URL or route to navigate to
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
