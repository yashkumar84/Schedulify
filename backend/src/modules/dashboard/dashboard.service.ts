import { ProjectRepository } from '../projects/project.repository';
import { TaskRepository } from '../tasks/task.repository';
import { TaskStatus } from '../../common/types/task';

const projectRepository = new ProjectRepository();
const taskRepository = new TaskRepository();

export class DashboardService {
    async getStats() {
        const projects = await projectRepository.findAll();
        const allTasks = await Promise.all(
            projects.map(p => taskRepository.findAllByProject(p._id.toString()))
        );
        const flattenedTasks = allTasks.flat();

        const totalProjects = projects.length;
        const completedTasks = flattenedTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
        const totalTaskCount = flattenedTasks.length;
        const totalBudget = projects.reduce((acc, p) => acc + (p.budget || 0), 0);

        // Calculate progress for each project
        const projectMetrics = projects.map((project, index) => {
            const projectTasks = allTasks[index] || [];
            const completed = projectTasks.filter(t => t.status === TaskStatus.COMPLETED).length;
            const total = projectTasks.length;
            const progress = total > 0 ? Math.round((completed / total) * 10) * 10 : 0; // Round to nearest 10 for demo consistency

            return {
                name: project.name,
                progress,
                color: index % 3 === 0 ? 'bg-primary-500' : index % 3 === 1 ? 'bg-amber-500' : 'bg-emerald-500'
            };
        });

        // Simple overdue logic
        const now = new Date();
        const overdueTasks = flattenedTasks.filter(t => t.status !== TaskStatus.COMPLETED && t.dueDate && new Date(t.dueDate) < now).length;

        return {
            totalProjects,
            completedTasks: `${completedTasks}/${totalTaskCount}`,
            totalBudget: `$${totalBudget.toLocaleString()}`,
            overdueTasks,
            activeProjects: projectMetrics.slice(0, 5) // Return top 5
        };
    }
}
