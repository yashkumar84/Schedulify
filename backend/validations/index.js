const { z } = require('zod');

const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  budget: z.number().min(0).optional(),
  manager: z.string().optional(),
  collaborators: z.array(z.string()).optional(),
  description: z.string().optional()
});

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  project: z.string().min(1, 'Project ID is required'),
  description: z.string().optional(),
  assignedTo: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().or(z.date()).optional()
});

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: error.errors
    });
  }
};

module.exports = {
  projectSchema,
  taskSchema,
  validate
};
