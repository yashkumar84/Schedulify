const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const sendEmail = require('../helpers/mail');
const { getTaskOverdueReminderTemplate } = require('../helpers/mailTemplates');

const startOverdueReminder = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running Overdue Task Reminder Cron Job...');

        try {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const dayAfter = new Date(tomorrow);
            dayAfter.setDate(dayAfter.getDate() + 1);

            // Find tasks due tomorrow that are not completed
            const tasks = await Task.find({
                dueDate: {
                    $gte: tomorrow,
                    $lt: dayAfter
                },
                status: { $ne: 'completed' },
                assignedTo: { $exists: true }
            }).populate('assignedTo', 'name email').populate('project', 'name');

            console.log(`🔍 Found ${tasks.length} tasks due tomorrow.`);

            for (const task of tasks) {
                if (task.assignedTo && task.assignedTo.email) {
                    try {
                        await sendEmail({
                            email: task.assignedTo.email,
                            subject: `Reminder: Task "${task.title}" is due tomorrow`,
                            html: getTaskOverdueReminderTemplate(task, task.assignedTo)
                        });
                        console.log(`✅ Sent reminder to ${task.assignedTo.email} for task: ${task.title}`);
                    } catch (mailError) {
                        console.error(`❌ Failed to send email to ${task.assignedTo.email}:`, mailError.message);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Overdue Reminder Cron Error:', error.message);
        }
    });
};

module.exports = { startOverdueReminder };
