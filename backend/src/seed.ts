import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './modules/users/user.model';
import { UserRole } from './common/types/user';

dotenv.config();

const seed = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskify';
        await mongoose.connect(mongoURI);
        console.log('✅ Connected to MongoDB for seeding');

        // Check if admin exists
        const adminExists = await User.findOne({ email: 'hello@gmail.com' });
        if (adminExists) {
            console.log('ℹ️ Super Admin (hello@gmail.com) already exists');
        } else {
            const hashedPassword = await bcrypt.hash('12345678', 10);
            await User.create({
                name: 'Super Admin',
                email: 'hello@gmail.com',
                password: hashedPassword,
                role: UserRole.SUPER_ADMIN,
                isActive: true,
            });
            console.log('✅ Super Admin created: hello@gmail.com / 12345678');
        }

        // Create a Project Manager
        const managerExists = await User.findOne({ email: 'manager@taskify.com' });
        if (!managerExists) {
            const hashedPassword = await bcrypt.hash('manager123', 10);
            await User.create({
                name: 'Project Manager',
                email: 'manager@taskify.com',
                password: hashedPassword,
                role: UserRole.PROJECT_MANAGER,
                isActive: true,
            });
            console.log('✅ Project Manager created: manager@taskify.com / manager123');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seed();
