import { TaskRepository } from './task.repository';
import { ITask } from './task.model';
import { EmailService } from '../../common/utils/email.service';

const taskRepository = new TaskRepository();
const emailService = new EmailService();

export class TaskService {
    async getTasksByProject(projectId: string) {
        return taskRepository.findAllByProject(projectId);
    }

    async getTaskById(id: string) {
        const task = await taskRepository.findById(id);
        if (!task) throw new Error('Task not found');
        return task;
    }

    async createTask(taskData: Partial<ITask>) {
        const task = await taskRepository.create(taskData);
        // Notify assigned user
        if (task.assignedTo) {
            const populatedTask = await taskRepository.findById(task._id.toString());
            if (populatedTask && populatedTask.assignedTo) {
                const user = populatedTask.assignedTo as any;
                const project = populatedTask.project as any;
                emailService.sendTaskAssignmentEmail(
                    user.email,
                    populatedTask.title,
                    project?.name || 'Assigned Project'
                ).catch(err => console.error('Email trigger failed:', err));
            }
        }
        return task;
    }

    async updateTask(id: string, taskData: Partial<ITask>) {
        return taskRepository.update(id, taskData);
    }

    async deleteTask(id: string) {
        return taskRepository.delete(id);
    }

    async addComment(taskId: string, userId: string, text: string) {
        return taskRepository.addComment(taskId, { user: userId, text });
    }
}
