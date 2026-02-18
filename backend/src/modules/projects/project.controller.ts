import { Request, Response } from 'express';
import { ProjectService } from './project.service';

const projectService = new ProjectService();

export class ProjectController {
    async getAllProjects(req: Request, res: Response) {
        try {
            const projects = await projectService.getAllProjects();
            res.json(projects);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }

    async getProjectById(req: Request, res: Response) {
        try {
            const project = await projectService.getProjectById(req.params.id as string);
            res.json(project);
        } catch (error: any) {
            res.status(404).json({ message: error.message });
        }
    }

    async createProject(req: any, res: Response) {
        try {
            const projectData = req.body;
            const currentUser = req.user;

            // Auto-assign SUPER_ADMIN as manager if no manager provided
            if (!projectData.manager && currentUser?.role === 'SUPER_ADMIN') {
                projectData.manager = currentUser.id || currentUser._id;
                console.log('Auto-assigning SUPER_ADMIN as project manager:', projectData.manager);
            }

            // Validate manager is provided
            if (!projectData.manager) {
                return res.status(400).json({
                    message: 'Project manager is required. Please select a manager or contact an administrator.'
                });
            }

            const project = await projectService.createProject(projectData);
            res.status(201).json(project);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateProject(req: Request, res: Response) {
        try {
            const project = await projectService.updateProject(req.params.id as string, req.body);
            res.json(project);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteProject(req: Request, res: Response) {
        try {
            await projectService.deleteProject(req.params.id as string);
            res.json({ message: 'Project deleted successfully' });
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    }
}
