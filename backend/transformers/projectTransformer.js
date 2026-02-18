const projectTransformer = (project, tasks = []) => {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
        id: project._id,
        name: project.name,
        clientName: project.clientName,
        startDate: project.startDate,
        endDate: project.endDate,
        budget: project.budget,
        manager: project.manager,
        status: project.status,
        description: project.description,
        metrics: {
            totalTasks,
            completedTasks,
            pendingTasks: totalTasks - completedTasks,
            progress
        }
    };
};

const projectListTransformer = (projects) => {
    return projects.map(p => ({
        id: p._id,
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        manager: p.manager ? { id: p.manager._id, name: p.manager.name } : null,
        endDate: p.endDate
    }));
};

module.exports = {
    projectTransformer,
    projectListTransformer
};
