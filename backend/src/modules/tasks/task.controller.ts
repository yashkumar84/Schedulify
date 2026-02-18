import { Request, Response } from 'express';
import { TaskService } from './task.service';

const taskService = new TaskService();

export class TaskController {
    async getTasksByProject(req: Request, res: Response) {
        try {
            const tasks = await taskService.getTasksByProject(req.params.projectId as string);
            res.json(tasks);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getTaskById(req: Request, res: Response) {
        try {
            const task = await taskService.getTaskById(req.params.id as string);
            res.json(task);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    async createTask(req: any, res: Response) {
        try {
            const task = await taskService.createTask(req.body);
            res.status(201).json(task);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateTask(req: Request, res: Response) {
        try {
            const task = await taskService.updateTask(req.params.id as string, req.body);
            res.json(task);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteTask(req: Request, res: Response) {
        try {
            await taskService.deleteTask(req.params.id as string);
            res.json({ message: 'Task deleted successfully' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async addComment(req: any, res: Response) {
        try {
            const task = await taskService.addComment(req.params.id, req.user.id, req.body.text);
            res.json(task);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
