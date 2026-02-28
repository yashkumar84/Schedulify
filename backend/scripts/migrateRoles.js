/**
 * Migration Script: Migrate old 5-role system to 2-role system
 * 
 * Old roles → TEAM_MEMBER with default permissions:
 *   PROJECT_MANAGER  → projects: CRUD, tasks: CRUD, team: read
 *   FINANCE_TEAM     → finance: CRUD, projects: read, tasks: read
 *   INHOUSE_TEAM     → projects: read, tasks: CRUD
 *   OUTSOURCED_TEAM  → projects: read, tasks: read+update
 * 
 * Run: node scripts/migrateRoles.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const defaultPermissionsByOldRole = {
    PROJECT_MANAGER: {
        projects: { create: true, read: true, update: true, delete: false },
        tasks: { create: true, read: true, update: true, delete: true },
        finance: { create: false, read: true, update: false, delete: false },
        team: { create: false, read: true, update: false, delete: false }
    },
    FINANCE_TEAM: {
        projects: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: false, delete: false },
        finance: { create: true, read: true, update: true, delete: false },
        team: { create: false, read: true, update: false, delete: false }
    },
    INHOUSE_TEAM: {
        projects: { create: false, read: true, update: false, delete: false },
        tasks: { create: true, read: true, update: true, delete: false },
        finance: { create: false, read: false, update: false, delete: false },
        team: { create: false, read: true, update: false, delete: false }
    },
    OUTSOURCED_TEAM: {
        projects: { create: false, read: true, update: false, delete: false },
        tasks: { create: false, read: true, update: true, delete: false },
        finance: { create: false, read: false, update: false, delete: false },
        team: { create: false, read: false, update: false, delete: false }
    }
};

const legacyRoles = ['PROJECT_MANAGER', 'FINANCE_TEAM', 'INHOUSE_TEAM', 'OUTSOURCED_TEAM'];

async function migrate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Find all users with legacy roles
        const usersToMigrate = await User.find({ role: { $in: legacyRoles } });
        console.log(`📋 Found ${usersToMigrate.length} users to migrate`);

        let migrated = 0;
        let skipped = 0;

        for (const user of usersToMigrate) {
            const oldRole = user.role;
            const defaultPerms = defaultPermissionsByOldRole[oldRole];

            if (!defaultPerms) {
                console.log(`⚠️  Skipping ${user.email} — unknown role: ${oldRole}`);
                skipped++;
                continue;
            }

            user.role = 'TEAM_MEMBER';
            user.permissions = defaultPerms;
            await user.save();

            console.log(`✅ ${user.email}: ${oldRole} → TEAM_MEMBER (permissions set)`);
            migrated++;
        }

        // Report
        const totalUsers = await User.countDocuments();
        const superAdmins = await User.countDocuments({ role: 'SUPER_ADMIN' });
        const teamMembers = await User.countDocuments({ role: 'TEAM_MEMBER' });
        const legacyLeft = await User.countDocuments({ role: { $in: legacyRoles } });

        console.log('\n📊 Migration Summary:');
        console.log(`  Total users: ${totalUsers}`);
        console.log(`  Super Admins: ${superAdmins}`);
        console.log(`  Team Members: ${teamMembers}`);
        console.log(`  Migrated: ${migrated}`);
        console.log(`  Skipped: ${skipped}`);
        console.log(`  Legacy roles remaining: ${legacyLeft}`);

        if (legacyLeft > 0) {
            console.warn(`\n⚠️  WARNING: ${legacyLeft} users still have legacy roles. Check manually.`);
        } else {
            console.log('\n🎉 Migration complete! All users are on the new 2-type system.');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

migrate();
