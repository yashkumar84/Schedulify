import User, { IUser } from './user.model';

export class UserRepository {
    async findByEmail(email: string): Promise<IUser | null> {
        return User.findOne({ email });
    }

    async findById(id: string): Promise<IUser | null> {
        return User.findById(id);
    }

    async create(userData: Partial<IUser>): Promise<IUser> {
        const user = new User(userData);
        return user.save();
    }

    async findAll(): Promise<IUser[]> {
        return User.find();
    }

    async update(id: string, userData: Partial<IUser>): Promise<IUser | null> {
        return User.findByIdAndUpdate(id, userData, { new: true });
    }
}
