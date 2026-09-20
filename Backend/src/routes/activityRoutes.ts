import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { activityController } from '../controllers/activityController.js';

const router = Router();

// All activity routes require authentication
router.use(authenticate);

// Summary & overview metrics
router.get('/activity/summary', activityController.getWorkSummary);

// Currently active / in-progress work
router.get('/activity/active', activityController.getActiveWork);

// Team workload aggregation
router.get('/activity/workload', activityController.getTeamWorkload);

// Completion trends & status distribution
router.get('/activity/trends', activityController.getCompletionTrends);

// Personal activity for the authenticated user
router.get('/activity/my', activityController.getMyActivity);

// Detailed user activity profile (RBAC enforced)
router.get('/activity/user/:userId', activityController.getUserActivity);

// Filterable, paginated activity feed
router.get('/activity', activityController.getActivityFeed);

export default router;
