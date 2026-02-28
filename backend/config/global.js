const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TEAM_MEMBER: 'TEAM_MEMBER'
};

// Legacy role values kept for migration reference only
const LegacyRoles = {
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  INHOUSE_TEAM: 'INHOUSE_TEAM',
  OUTSOURCED_TEAM: 'OUTSOURCED_TEAM',
  FINANCE_TEAM: 'FINANCE_TEAM'
};

const Features = {
  PROJECTS: 'projects',
  TASKS: 'tasks',
  FINANCE: 'finance',
  TEAM: 'team'
};

const CrudOps = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete'
};

const ProjectStatus = {
  NOT_STARTED: 'Not Started',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  COMPLETED: 'Completed'
};

const TaskStatus = {
  TODO: 'todo',
  IN_PROGRESS: 'in-progress',
  IN_REVIEW: 'in-review',
  COMPLETED: 'completed'
};

const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

const ApprovalStatus = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

module.exports = {
  Roles,
  LegacyRoles,
  Features,
  CrudOps,
  ProjectStatus,
  TaskStatus,
  TaskPriority,
  ApprovalStatus
};
