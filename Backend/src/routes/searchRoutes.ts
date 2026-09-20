import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { searchController } from '../controllers/searchController.js';

const router = Router();

router.get('/search', authenticate, searchController.search);

export default router;
