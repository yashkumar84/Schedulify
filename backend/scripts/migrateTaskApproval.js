const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const { ApprovalStatus, Roles } = require('../config/global');
require('dotenv').config();

/**
 * Migration script to add approval fields to existing tasks
 * This script will:
 * 1. Add createdBy field (set to project manager or first admin)
 * 2. Set approvalStatus to 'approved' for all existing tasks
 * 3. Set approvedBy and approvedAt for backward compatibility
 */

const migrateTaskApproval = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/taskify');
        console.log('✅ Connected to MongoDB');

        // Get first admin user as fallback
        const adminUser = await User.findOne({ role: Roles.SUPER_ADMIN });
        if (!adminUser) {
            console.error('❌ No admin user found. Please create an admin user first.');
            process.exit(1);
        }

        // Find all tasks without approval fields
        const tasksToMigrate = await Task.find({
            $or: [
                { createdBy: { $exists: false } },
                { approvalStatus: { $exists: false } }
            ]
        });

        console.log(`📊 Found ${tasksToMigrate.length} tasks to migrate`);

        let migratedCount = 0;
        let errorCount = 0;

        for (const task of tasksToMigrate) {
            try {
                // Set createdBy to admin as fallback (we don't know the original creator)
                if (!task.createdBy) {
                    task.createdBy = adminUser._id;
                }

                // Set all existing tasks as approved
                task.approvalStatus = ApprovalStatus.APPROVED;
                task.approvedBy = adminUser._id;
                task.approvedAt = task.createdAt || new Date();

                // Add migration note to activity log
                if (!task.activityLog) {
                    task.activityLog = [];
                }

                task.activityLog.push({
                    user: adminUser._id,
                    action: 'Task migrated to approval system (auto-approved)',
                    timestamp: new Date()
                });

                await task.save();
                migratedCount++;

                if (migratedCount % 10 === 0) {
                    console.log(`⏳ Migrated ${migratedCount}/${tasksToMigrate.length} tasks...`);
                }
            } catch (error) {
                console.error(`❌ Error migrating task ${task._id}:`, error.message);
                errorCount++;
            }
        }

        console.log('\n📈 Migration Summary:');
        console.log(`✅ Successfully migrated: ${migratedCount} tasks`);
        console.log(`❌ Failed: ${errorCount} tasks`);
        console.log(`📊 Total: ${tasksToMigrate.length} tasks`);

        // Verify migration
        const pendingTasks = await Task.countDocuments({ approvalStatus: ApprovalStatus.PENDING });
        const approvedTasks = await Task.countDocuments({ approvalStatus: ApprovalStatus.APPROVED });
        const rejectedTasks = await Task.countDocuments({ approvalStatus: ApprovalStatus.REJECTED });

        console.log('\n📊 Current Task Status Distribution:');
        console.log(`✅ Approved: ${approvedTasks}`);
        console.log(`⏳ Pending: ${pendingTasks}`);
        console.log(`❌ Rejected: ${rejectedTasks}`);

        console.log('\n✨ Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
};

// Run migration
migrateTaskApproval();
