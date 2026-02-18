const Roles = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    PROJECT_MANAGER: 'PROJECT_MANAGER',
    INHOUSE_TEAM: 'INHOUSE_TEAM',
    OUTSOURCED_TEAM: 'OUTSOURCED_TEAM',
    FINANCE_TEAM: 'FINANCE_TEAM'
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
    COMPLETED: 'completed'
};

const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
};

const ApprovalStatus = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};

module.exports = {
    Roles,
    ProjectStatus,
    TaskStatus,
    TaskPriority,
    ApprovalStatus
};
