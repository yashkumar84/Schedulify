import { ProjectRepository } from './project.repository';
import { IProject } from './project.model';

const projectRepository = new ProjectRepository();

export class ProjectService {
    async getAllProjects() {
        return projectRepository.findAll();
    }

    async getProjectById(id: string) {
        const project = await projectRepository.findById(id);
        if (!project) throw new Error('Project not found');
        return project;
    }

    async createProject(projectData: Partial<IProject>) {
        return projectRepository.create(projectData);
    }

    async updateProject(id: string, projectData: Partial<IProject>) {
        return projectRepository.update(id, projectData);
    }

    async deleteProject(id: string) {
        return projectRepository.delete(id);
    }
}
