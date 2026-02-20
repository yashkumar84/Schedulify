const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    task: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
    },
    action: {
        type: String,
        required: true
        // e.g., 'created', 'updated', 'deleted', 'status_changed', 'member_added', 'member_removed'
    },
    entityType: {
        type: String,
        required: true,
        enum: ['PROJECT', 'TASK', 'EXPENSE', 'MEMBER']
    },
    entityName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    metadata: {
        type: Object // for storing before/after changes if needed
    }
}, {
    timestamps: true
});

// Index for faster queries
activitySchema.index({ project: 1, createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);
module.exports = Activity;
