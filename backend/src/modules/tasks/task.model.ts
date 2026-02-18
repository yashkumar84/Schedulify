import mongoose, { Schema, Document } from 'mongoose';

import { TaskPriority, TaskStatus } from '../../common/types/task';

export interface ITaskActivity {
    user: mongoose.Types.ObjectId;
    action: string;
    timestamp: Date;
}

export interface ITask extends Document {
    title: string;
    description?: string;
    project: mongoose.Types.ObjectId;
    assignedTo: mongoose.Types.ObjectId;
    priority: TaskPriority;
    status: TaskStatus;
    startDate?: Date;
    dueDate: Date;
    files: string[];
    comments: {
        user: mongoose.Types.ObjectId;
        text: string;
        timestamp: Date;
    }[];
    activityLog: ITaskActivity[];
}

const TaskSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        priority: {
            type: String,
            enum: Object.values(TaskPriority),
            default: TaskPriority.MEDIUM
        },
        status: {
            type: String,
            enum: Object.values(TaskStatus),
            default: TaskStatus.TODO
        },
        startDate: { type: Date },
        dueDate: { type: Date, required: true },
        files: [{ type: String }],
        comments: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                text: { type: String },
                timestamp: { type: Date, default: Date.now },
            }
        ],
        activityLog: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                action: { type: String },
                timestamp: { type: Date, default: Date.now },
            }
        ],
    },
    { timestamps: true }
);

export default mongoose.model<ITask>('Task', TaskSchema);
