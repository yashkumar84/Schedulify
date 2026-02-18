import mongoose, { Schema, Document } from 'mongoose';

import { UserRole } from '../../common/types/user';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    isActive: boolean;
    avatar?: string;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true, index: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.TEAM_MEMBER_INHOUSE
        },
        isActive: { type: Boolean, default: true },
        avatar: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
