const mongoose = require('mongoose');
const { ProjectStatus } = require('../config/global');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  clientName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  budget: {
    type: Number,
    required: true,
    default: 0
  },
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ProjectStatus),
    default: ProjectStatus.NOT_STARTED
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
