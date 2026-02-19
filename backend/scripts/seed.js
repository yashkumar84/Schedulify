const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const { Roles } = require('../config/global');
const { mongoURI } = require('../config/config');
const { hashPassword } = require('../helpers/common');

dotenv.config();

const seed = async() => {
  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB for seeding');

    // Create Super Admin
    const superAdminExists = await User.findOne({ email: 'hello@gmail.com' });
    if (!superAdminExists) {
      const hashedPassword = await hashPassword('12345678');
      await User.create({
        name: 'Super Admin',
        email: 'hello@gmail.com',
        password: hashedPassword,
        role: Roles.SUPER_ADMIN,
        isActive: true
      });
      console.log('✅ Super Admin created: hello@gmail.com / 12345678');
    }

    // Create Project Manager
    const managerExists = await User.findOne({ email: 'manager@taskify.com' });
    if (!managerExists) {
      const hashedPassword = await hashPassword('manager123');
      await User.create({
        name: 'Project Manager',
        email: 'manager@taskify.com',
        password: hashedPassword,
        role: Roles.PROJECT_MANAGER,
        isActive: true
      });
      console.log('✅ Project Manager created: manager@taskify.com / manager123');
    }

    // Create Finance User
    const financeExists = await User.findOne({ email: 'finance@taskify.com' });
    if (!financeExists) {
      const hashedPassword = await hashPassword('finance123');
      await User.create({
        name: 'Finance Admin',
        email: 'finance@taskify.com',
        password: hashedPassword,
        role: Roles.FINANCE_TEAM,
        isActive: true
      });
      console.log('✅ Finance User created: finance@taskify.com / finance123');
    }

    console.log('🌱 Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding Error:', error);
    process.exit(1);
  }
};

seed();
