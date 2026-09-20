import { Router } from 'express';
import { taskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Apply authentication to all task routes
router.use(authenticate);

// Task Collection & Creation
router.get('/tasks', taskController.getTasks);
router.post('/tasks', taskController.createTask);

// Single Task Operations
router.get('/tasks/:id', taskController.getTaskById);
router.patch('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.cancelTask);

// Lifecycle Transitions
router.post('/tasks/:id/start', taskController.startTask);
router.post('/tasks/:id/complete', taskController.completeTask);

// Collaborative Features
router.post('/tasks/:id/comments', taskController.addComment);
router.get('/tasks/:id/activity', taskController.getTaskActivity);
router.post('/tasks/:id/proof', taskController.uploadProofOfWork);

export default router;
