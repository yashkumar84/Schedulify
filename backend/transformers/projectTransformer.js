const { Roles } = require('../config/global');

const projectTransformer = (project, tasks = [], role = null) => {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const transformed = {
    id: project._id,
    name: project.name,
    clientName: project.clientName,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: project.budget,
    manager: project.manager,
    collaborators: project.collaborators || [],
    status: project.status,
    description: project.description,
    metrics: {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      progress
    }
  };

  // Only Super Admin can see budget
  if (role !== Roles.SUPER_ADMIN) {
    transformed.budget = null;
  }

  return transformed;
};

const projectListTransformer = (projects, role = null) => {
  return projects.map(p => {
    const transformed = {
      id: p._id,
      name: p.name,
      clientName: p.clientName,
      status: p.status,
      manager: p.manager ? { id: p.manager._id, name: p.manager.name } : null,
      description: p.description,
      startDate: p.startDate,
      budget: p.budget,
      collaborators: p.collaborators ? p.collaborators.map(c => ({ id: c._id, name: c.name })) : [],
      endDate: p.endDate
    };

    if (role !== Roles.SUPER_ADMIN) {
      transformed.budget = null;
    }

    return transformed;
  });
};

module.exports = {
  projectTransformer,
  projectListTransformer
};
