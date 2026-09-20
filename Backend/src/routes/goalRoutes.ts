import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { goalController } from '../controllers/goalController.js';

const router = Router();

// All goal routes require authentication
router.use(authenticate);

// Summary & overview metrics (must precede /:id)
router.get('/goals/summary', goalController.getGoalSummary);

// Goal collection CRUD
router.get('/goals', goalController.getGoals);
router.post('/goals', goalController.createGoal);
router.get('/goals/:id', goalController.getGoalById);
router.patch('/goals/:id', goalController.updateGoal);
router.delete('/goals/:id', goalController.deleteGoal);

// Objectives
router.post('/goals/:goalId/objectives', goalController.addObjective);

// Key Results
router.post('/objectives/:objectiveId/key-results', goalController.addKeyResult);
router.patch('/key-results/:id/progress', goalController.updateKeyResultProgress);

// Comments
router.post('/goals/:id/comments', goalController.addComment);

export default router;
