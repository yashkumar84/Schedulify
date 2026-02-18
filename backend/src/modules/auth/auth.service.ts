import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../users/user.repository';
import { IUser } from '../users/user.model';
import { UserRole } from '../../common/types/user';

const userRepository = new UserRepository();

export class AuthService {
    async register(userData: Partial<IUser>) {
        const existingUser = await userRepository.findByEmail(userData.email!);
        if (existingUser) {
            throw new Error('User already exists');
        }

        const hashedPassword = await bcrypt.hash(userData.password!, 10);
        const newUser = {
            ...userData,
            role: userData.role || UserRole.TEAM_MEMBER_INHOUSE,
            password: hashedPassword
        };
        return userRepository.create(newUser);
    }

    async login(email: string, password: string) {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) {
            throw new Error('Invalid credentials');
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        return { user, token };
    }
}
