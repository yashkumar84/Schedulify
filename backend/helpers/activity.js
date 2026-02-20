const Activity = require('../models/Activity');

const logActivity = async ({
    user,
    project = null,
    task = null,
    action,
    entityType,
    entityName,
    description = null,
    metadata = null
}) => {
    try {
        const activity = new Activity({
            user,
            project,
            task,
            action,
            entityType,
            entityName,
            description,
            metadata
        });

        await activity.save();
        return activity;
    } catch (error) {
        console.error('Activity Logging Error:', error);
        // We don't want to throw error if logging fails, to avoid breaking the main request
    }
};

module.exports = { logActivity };
