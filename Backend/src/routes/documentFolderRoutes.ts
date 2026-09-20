import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { documentFolderController } from '../controllers/documentFolderController';

const router = Router();

// Apply JWT authentication
router.use(authenticate);

router.get('/document-folders', (req, res) => documentFolderController.getFolders(req, res));
router.get('/document-folders/:id', (req, res) => documentFolderController.getFolderById(req, res));
router.post('/document-folders', (req, res) => documentFolderController.createFolder(req, res));
router.patch('/document-folders/:id', (req, res) => documentFolderController.updateFolder(req, res));
router.delete('/document-folders/:id', (req, res) => documentFolderController.deleteFolder(req, res));

export default router;
