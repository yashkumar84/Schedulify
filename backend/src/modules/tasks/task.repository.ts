import Task, { ITask } from './task.model';

export class TaskRepository {
    async findAllByProject(projectId: string): Promise<ITask[]> {
        return Task.find({ project: projectId }).populate('assignedTo', 'name email avatar');
    }

    async findById(id: string): Promise<ITask | null> {
        return Task.findById(id)
            .populate('assignedTo', 'name email avatar')
            .populate('project', 'name')
            .populate('comments.user', 'name email');
    }

    async create(taskData: Partial<ITask>): Promise<ITask> {
        const task = new Task(taskData);
        return task.save();
    }

    async update(id: string, taskData: Partial<ITask>): Promise<ITask | null> {
        return Task.findByIdAndUpdate(id, taskData, { new: true });
    }

    async delete(id: string): Promise<ITask | null> {
        return Task.findByIdAndDelete(id);
    }

    async addComment(taskId: string, comment: { user: string; text: string }) {
        return Task.findByIdAndUpdate(
            taskId,
            { $push: { comments: comment, activityLog: { user: comment.user, action: `Added a comment: ${comment.text}`, timestamp: new Date() } } },
            { new: true }
        ).populate('comments.user', 'name email');
    }
}
