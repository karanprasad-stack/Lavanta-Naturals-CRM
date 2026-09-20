import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth';
import { documentController } from '../controllers/documentController';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024 // 25 MB
  }
});

const router = Router();

// Apply JWT authentication across all document endpoints
router.use(authenticate);

// List, Search & Summaries
router.get('/documents', (req, res) => documentController.getDocuments(req, res));
router.get('/documents/search', (req, res) => documentController.searchDocuments(req, res));
router.get('/documents/favorites', (req, res) => documentController.getFavorites(req, res));
router.get('/documents/summary', (req, res) => documentController.getDocumentSummary(req, res));

// Document Creation (multipart or JSON)
router.post('/documents', upload.single('file'), (req, res) => documentController.createDocument(req, res));

// Detail, Update, Delete
router.get('/documents/:id', (req, res) => documentController.getDocumentById(req, res));
router.patch('/documents/:id', (req, res) => documentController.updateDocument(req, res));
router.delete('/documents/:id', (req, res) => documentController.deleteDocument(req, res));

// Streaming Endpoints (Download & Inline Preview)
router.get('/documents/:id/download', (req, res) => documentController.downloadDocument(req, res));
router.get('/documents/:id/preview', (req, res) => documentController.previewDocument(req, res));

// Versioning
router.get('/documents/:id/versions', (req, res) => documentController.getDocumentVersions(req, res));
router.post('/documents/:id/versions', upload.single('file'), (req, res) => documentController.createVersion(req, res));
router.get('/documents/:id/versions/:versionNum/download', (req, res) => documentController.downloadSpecificVersion(req, res));

// Access & Sharing
router.get('/documents/:id/access', (req, res) => documentController.getDocumentAccess(req, res));
router.patch('/documents/:id/access', (req, res) => documentController.updateAccess(req, res));

// Favorites
router.post('/documents/:id/favorite', (req, res) => documentController.toggleFavorite(req, res));
router.delete('/documents/:id/favorite', (req, res) => documentController.toggleFavorite(req, res));

// Audit Activity
router.get('/documents/:id/activity', (req, res) => documentController.getDocumentActivity(req, res));

export default router;
