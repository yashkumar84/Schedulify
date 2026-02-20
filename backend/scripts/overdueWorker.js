const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
const Task = require('../models/Task');
const User = require('../models/User');
const { connectDB } = require('../config/config');
const sendEmail = require('../helpers/mail');
const { getOverdueTaskTemplate } = require('../helpers/mailTemplates');
const { TaskStatus, Roles } = require('../config/global');

const checkOverdueTasks = async () => {
    try {
        await connectDB();
        console.log('--- Checking for Overdue Tasks ---');

        const now = new Date();

        // Find tasks that are:
        // 1. Not completed
        // 2. Due date has passed
        // 3. Haven't been notified today (optional logic, but for now just send)
        const overdueTasks = await Task.find({
            status: { $ne: TaskStatus.COMPLETED },
            dueDate: { $lt: now },
            assignedTo: { $exists: true }
        }).populate('assignedTo project');

        console.log(`Found ${overdueTasks.length} overdue tasks.`);

        for (const task of overdueTasks) {
            if (!task.assignedTo || !task.assignedTo.email) continue;

            console.log(`Sending alert for: ${task.title} to ${task.assignedTo.email}`);

            const html = getOverdueTaskTemplate(task);

            await sendEmail({
                email: task.assignedTo.email,
                subject: `⚠️ OVERDUE TASK: ${task.title}`,
                html: html
            });

            // Also notify Super Admins if needed
            const superAdmins = await User.find({ role: Roles.SUPER_ADMIN });
            for (const admin of superAdmins) {
                await sendEmail({
                    email: admin.email,
                    subject: `⚠️ OVERDUE TASK (Admin Alert): ${task.title}`,
                    html: html
                });
            }
        }

        console.log('--- Overdue Check Completed ---');
        process.exit(0);
    } catch (error) {
        console.error('Error in overdue worker:', error);
        process.exit(1);
    }
};

checkOverdueTasks();
