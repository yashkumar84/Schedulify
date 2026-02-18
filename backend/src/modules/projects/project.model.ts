import mongoose, { Schema, Document } from 'mongoose';

import { ProjectStatus } from '../../common/types/project';

export interface IProject extends Document {
    name: string;
    clientName: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    manager: mongoose.Types.ObjectId;
    status: ProjectStatus;
    description?: string;
}

const ProjectSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        clientName: { type: String, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        budget: { type: Number, required: true, default: 0 },
        manager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: Object.values(ProjectStatus),
            default: ProjectStatus.NOT_STARTED
        },
        description: { type: String },
    },
    { timestamps: true }
);

export default mongoose.model<IProject>('Project', ProjectSchema);
