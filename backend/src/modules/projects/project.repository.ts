import Project, { IProject } from './project.model';

export class ProjectRepository {
    async findAll(): Promise<IProject[]> {
        return Project.find().populate('manager', 'name email');
    }

    async findById(id: string): Promise<IProject | null> {
        return Project.findById(id).populate('manager', 'name email');
    }

    async create(projectData: Partial<IProject>): Promise<IProject> {
        const project = new Project(projectData);
        return project.save();
    }

    async update(id: string, projectData: Partial<IProject>): Promise<IProject | null> {
        return Project.findByIdAndUpdate(id, projectData, { new: true });
    }

    async delete(id: string): Promise<IProject | null> {
        return Project.findByIdAndDelete(id);
    }
}
