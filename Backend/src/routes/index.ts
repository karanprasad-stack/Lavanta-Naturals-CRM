import { Router } from 'express';
import healthRoutes from './health.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import taskRoutes from './tasks.js';
import notificationRoutes from './notificationRoutes.js';
import announcementRoutes from './announcementRoutes.js';
import chatRoutes from './chatRoutes.js';
import calendarRoutes from './calendarRoutes.js';
import activityRoutes from './activityRoutes.js';
import goalRoutes from './goalRoutes.js';
import documentRoutes from './documentRoutes.js';
import documentFolderRoutes from './documentFolderRoutes.js';
import productCategoryRoutes from './productCategoryRoutes.js';
import productRoutes from './productRoutes.js';
import inventoryRoutes from './inventoryRoutes.js';
import customerRoutes from './customerRoutes.js';
import orderRoutes from './orderRoutes.js';
import salesRoutes from './salesRoutes.js';
import expenseRoutes from './expenseRoutes.js';
import financeRoutes from './financeRoutes.js';
import founderRoutes from './founderRoutes.js';
import searchRoutes from './searchRoutes.js';
import auditRoutes from './auditRoutes.js';
import exportRoutes from './exportRoutes.js';

const apiRouter = Router();

// Mount system routes
apiRouter.use(healthRoutes);

// Mount core auth & user routes
apiRouter.use(authRoutes);
apiRouter.use(userRoutes);
apiRouter.use(dashboardRoutes);

// Mount task management, announcements, chat, notifications, calendar, activity, goal & document routes
apiRouter.use(taskRoutes);
apiRouter.use(announcementRoutes);
apiRouter.use(chatRoutes);
apiRouter.use(notificationRoutes);
apiRouter.use(calendarRoutes);
apiRouter.use(activityRoutes);
apiRouter.use(goalRoutes);
apiRouter.use(documentRoutes);
apiRouter.use(documentFolderRoutes);

// Mount products and inventory routes (Phase 11)
apiRouter.use(productCategoryRoutes);
apiRouter.use(productRoutes);
apiRouter.use(inventoryRoutes);

// Mount sales, orders, and expense routes (Phase 12)
apiRouter.use(customerRoutes);
apiRouter.use(orderRoutes);
apiRouter.use(salesRoutes);
apiRouter.use(expenseRoutes);
apiRouter.use(financeRoutes);

// Mount Phase 13 routes (Founder Command Center, Global Search, Security Audit, Data Export)
apiRouter.use(founderRoutes);
apiRouter.use(searchRoutes);
apiRouter.use(auditRoutes);
apiRouter.use(exportRoutes);

export default apiRouter;
