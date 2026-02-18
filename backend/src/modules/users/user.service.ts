import { UserRepository } from './user.repository';
import { IUser } from './user.model';
import bcrypt from 'bcryptjs';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async getProfile(userId: string): Promise<IUser | null> {
        const user = await this.userRepository.findById(userId);
        if (user) {
            user.password = undefined;
        }
        return user;
    }

    async updateProfile(userId: string, data: Partial<IUser>): Promise<IUser | null> {
        // Remove password from data if it exists to prevent accidental updates
        const { password, ...updateData } = data as any;
        return this.userRepository.update(userId, updateData);
    }

    async changePassword(userId: string, currentPass: string, newPass: string): Promise<boolean> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.password) return false;

        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) return false;

        const hashedPass = await bcrypt.hash(newPass, 10);
        await this.userRepository.update(userId, { password: hashedPass });
        return true;
    }
}
