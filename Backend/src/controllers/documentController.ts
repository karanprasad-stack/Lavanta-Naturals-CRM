import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  DocumentModel,
  IDocumentItem,
  DocumentCategory,
  DocumentVisibility,
  DocumentStatus,
  DocumentFileType
} from '../models/Document';
import { DocumentFolderModel } from '../models/DocumentFolder';
import { DocumentVersionModel } from '../models/DocumentVersion';
import { DocumentActivityModel, DocumentActivityType } from '../models/DocumentActivity';
import { DocumentFavoriteModel } from '../models/DocumentFavorite';
import { NotificationModel } from '../models/Notification';
import { UserModel } from '../models/User';
import { getStorageProvider } from '../services/storage';

const UNSAFE_EXTENSIONS = [
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.msi',
  '.dll',
  '.vbs',
  '.scr',
  '.com',
  '.pif'
];

export function determineFileType(mimeType: string, fileName: string): DocumentFileType {
  const mime = (mimeType || '').toLowerCase();
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (
    mime.startsWith('image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)
  ) {
    return 'IMAGE';
  }
  if (
    mime.includes('word') ||
    ['doc', 'docx', 'odt', 'rtf'].includes(ext)
  ) {
    return 'DOC';
  }
  if (
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
  ) {
    return 'SHEET';
  }
  if (
    mime.startsWith('text/') ||
    ['txt', 'md', 'json', 'xml', 'log'].includes(ext)
  ) {
    return 'TEXT';
  }
  return 'OTHER';
}

export function canAccessDocument(user: any, doc: IDocumentItem): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();

  // Founder has unrestricted access
  if (role === 'FOUNDER') return true;

  // Archived or Draft documents are restricted to management or uploader
  if (doc.status === 'ARCHIVED' || doc.status === 'DRAFT') {
    if (doc.uploadedBy && doc.uploadedBy.toString() === user._id.toString()) return true;
    if (role === 'HR' && (doc.category === 'HR' || doc.category === 'POLICY')) return true;
    return false;
  }

  // Explicit allowed users override general visibility
  if (doc.allowedUsers && doc.allowedUsers.some((uid: any) => uid.toString() === user._id.toString())) {
    return true;
  }

  // Private visibility
  if (doc.visibility === 'PRIVATE') {
    return doc.uploadedBy && doc.uploadedBy.toString() === user._id.toString();
  }

  // Role visibility
  if (doc.visibility === 'ROLE') {
    return (doc.allowedRoles || []).map(r => r.toUpperCase()).includes(role);
  }

  // Department visibility
  if (doc.visibility === 'DEPARTMENT') {
    const userDept = (user.department || '').toLowerCase();
    const docDept = (doc.department || '').toLowerCase();
    if (userDept && userDept === docDept) return true;
    if ((doc.allowedDepartments || []).map(d => d.toLowerCase()).includes(userDept)) return true;
    return role === 'HR';
  }

  // Team visibility
  if (doc.visibility === 'TEAM') {
    const userTeam = (user.team || user.department || '').toLowerCase();
    const docDept = (doc.department || '').toLowerCase();
    if (userTeam && userTeam === docDept) return true;
    if ((doc.allowedTeams || []).map(t => t.toLowerCase()).includes(userTeam)) return true;
    return role === 'HR';
  }

  // Company visibility
  if (doc.visibility === 'COMPANY') {
    if (doc.allowedRoles && doc.allowedRoles.length > 0) {
      return doc.allowedRoles.map(r => r.toUpperCase()).includes(role);
    }
    return true;
  }

  return false;
}

export function canManageDocument(user: any, doc: IDocumentItem): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();

  if (role === 'FOUNDER') return true;
  if (doc.uploadedBy && doc.uploadedBy.toString() === user._id.toString()) return true;
  if (role === 'HR' && (doc.category === 'HR' || doc.category === 'POLICY')) return true;
  if (role === 'MANAGER' && (user.department || '').toLowerCase() === (doc.department || '').toLowerCase()) return true;

  return false;
}

export async function logDocumentActivity(
  documentId: Types.ObjectId,
  userId: Types.ObjectId,
  type: DocumentActivityType,
  metadata: Record<string, any> = {}
) {
  try {
    await DocumentActivityModel.create({
      documentId,
      userId,
      type,
      metadata
    });
  } catch (err) {
    console.warn('[logDocumentActivity] Warning:', err);
  }
}

export class DocumentController {
  // GET /api/documents
  async getDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const {
        category,
        department,
        folderId,
        fileType,
        visibility,
        status,
        tag,
        isPinned,
        page = '1',
        limit = '20',
        sort = 'updatedAt'
      } = req.query;

      const filter: any = { isDeleted: false };

      if (category && category !== 'ALL') {
        filter.category = (category as string).toUpperCase();
      }

      if (department) {
        filter.department = department;
      }

      if (folderId !== undefined) {
        filter.folderId = folderId === 'null' || folderId === '' ? null : new Types.ObjectId(folderId as string);
      }

      if (fileType) {
        filter.fileType = (fileType as string).toUpperCase();
      }

      if (visibility) {
        filter.visibility = (visibility as string).toUpperCase();
      }

      if (status) {
        filter.status = (status as string).toUpperCase();
      } else {
        // By default, exclude ARCHIVED unless specifically queried
        filter.status = { $ne: 'ARCHIVED' };
      }

      if (tag) {
        filter.tags = (tag as string).toLowerCase().trim();
      }

      if (isPinned === 'true') {
        filter.isPinned = true;
      }

      const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));

      const sortOptions: any = {};
      if (sort === 'pinned') {
        sortOptions.isPinned = -1;
        sortOptions.updatedAt = -1;
      } else if (sort === 'views') {
        sortOptions.viewsCount = -1;
      } else if (sort === 'downloads') {
        sortOptions.downloadsCount = -1;
      } else if (sort === 'title') {
        sortOptions.title = 1;
      } else {
        sortOptions.isPinned = -1;
        sortOptions.updatedAt = -1;
      }

      const rawDocuments = await DocumentModel.find(filter)
        .sort(sortOptions)
        .populate('uploadedBy', 'name role department profilePhoto')
        .populate('folderId', 'name depth')
        .lean();

      // Enforce RBAC access per document
      const permittedDocs = rawDocuments.filter((doc: any) => canAccessDocument(user, doc));

      const total = permittedDocs.length;
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedDocs = permittedDocs.slice(startIndex, startIndex + limitNum);

      // Attach user's favorite status
      const docIds = paginatedDocs.map((d: any) => d._id);
      const userFavorites = await DocumentFavoriteModel.find({
        userId: user._id,
        documentId: { $in: docIds }
      }).lean();

      const favoriteSet = new Set(userFavorites.map((f: any) => f.documentId.toString()));

      const enriched = paginatedDocs.map((d: any) => ({
        ...d,
        isFavorited: favoriteSet.has(d._id.toString())
      }));

      res.json({
        success: true,
        data: enriched,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1
        }
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocuments] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve documents', error: error.message });
    }
  }

  // GET /api/documents/search
  async searchDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const query = ((req.query.q as string) || '').trim();
      if (!query) {
        res.json({ success: true, data: [] });
        return;
      }

      const regex = new RegExp(query, 'i');
      const docs = await DocumentModel.find({
        isDeleted: false,
        status: { $ne: 'ARCHIVED' },
        $or: [
          { title: regex },
          { description: regex },
          { tags: regex },
          { fileName: regex },
          { category: regex }
        ]
      })
        .limit(50)
        .sort({ isPinned: -1, updatedAt: -1 })
        .populate('uploadedBy', 'name role department profilePhoto')
        .populate('folderId', 'name')
        .lean();

      const permitted = docs.filter((doc: any) => canAccessDocument(user, doc));

      res.json({
        success: true,
        data: permitted
      });
    } catch (error: any) {
      console.error('[DocumentController.searchDocuments] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to search documents', error: error.message });
    }
  }

  // GET /api/documents/:id
  async getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid document ID format' });
        return;
      }

      const doc = await DocumentModel.findById(id)
        .populate('uploadedBy', 'name email role department profilePhoto')
        .populate('folderId', 'name depth parentFolderId')
        .populate('allowedUsers', 'name role department profilePhoto');

      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied: You do not have permission to view this document' });
        return;
      }

      // Increment view count atomically
      await DocumentModel.updateOne({ _id: doc._id }, { $inc: { viewsCount: 1 } });
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_VIEWED', {
        viewerRole: user.role
      });

      // Check if user favorited
      const isFavorited = !!(await DocumentFavoriteModel.findOne({
        userId: user._id,
        documentId: doc._id
      }));

      // Fetch versions summary
      const versions = await DocumentVersionModel.find({ documentId: doc._id })
        .sort({ version: -1 })
        .populate('uploadedBy', 'name role')
        .lean();

      res.json({
        success: true,
        data: {
          ...doc.toObject(),
          isFavorited,
          versions,
          canManage: canManageDocument(user, doc)
        }
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocumentById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve document details', error: error.message });
    }
  }

  // POST /api/documents
  async createDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // Check file in multipart upload
      const file = (req as any).file;
      const body = req.body;

      let fileName = body.fileName || (file ? file.originalname : '');
      let mimeType = body.mimeType || (file ? file.mimetype : 'application/octet-stream');
      let fileSize = file ? file.size : parseInt(body.fileSize || '0', 10);
      let fileBuffer = file ? file.buffer : (body.fileBuffer ? Buffer.from(body.fileBuffer, 'base64') : null);

      if (!fileName || !fileBuffer) {
        res.status(400).json({ success: false, message: 'Document file and file name are required' });
        return;
      }

      // Validate unsafe file extensions
      const ext = ('.' + (fileName.split('.').pop() || '')).toLowerCase();
      if (UNSAFE_EXTENSIONS.includes(ext)) {
        res.status(400).json({ success: false, message: `Disallowed unsafe file format (${ext})` });
        return;
      }

      // Max file size: 25 MB
      if (fileSize > 25 * 1024 * 1024) {
        res.status(400).json({ success: false, message: 'File size exceeds maximum permitted limit (25 MB)' });
        return;
      }

      const title = (body.title || fileName).trim();
      const description = (body.description || '').trim();
      const category: DocumentCategory = (body.category || 'GENERAL').toUpperCase();
      const department = (body.department || user.department || 'General').trim();
      const visibility: DocumentVisibility = (body.visibility || 'COMPANY').toUpperCase();
      const status: DocumentStatus = (body.status || 'PUBLISHED').toUpperCase();
      const isPinned = body.isPinned === 'true' || body.isPinned === true;
      const folderId = body.folderId && Types.ObjectId.isValid(body.folderId) ? new Types.ObjectId(body.folderId) : null;

      // Parse tags
      let tags: string[] = [];
      if (Array.isArray(body.tags)) {
        tags = body.tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean);
      } else if (typeof body.tags === 'string' && body.tags) {
        tags = body.tags.split(',').map((t: string) => t.toLowerCase().trim()).filter(Boolean);
      }

      // Parse allowed roles & users
      let allowedRoles: string[] = [];
      if (Array.isArray(body.allowedRoles)) {
        allowedRoles = body.allowedRoles.map((r: string) => r.toUpperCase().trim());
      } else if (typeof body.allowedRoles === 'string' && body.allowedRoles) {
        allowedRoles = body.allowedRoles.split(',').map((r: string) => r.toUpperCase().trim());
      }

      let allowedUsers: Types.ObjectId[] = [];
      if (Array.isArray(body.allowedUsers)) {
        allowedUsers = body.allowedUsers.filter((u: string) => Types.ObjectId.isValid(u)).map((u: string) => new Types.ObjectId(u));
      }

      const storage = getStorageProvider();
      const saved = await storage.saveFile(fileBuffer, fileName, mimeType, 'documents');

      const fileType = determineFileType(mimeType, fileName);

      const doc = await DocumentModel.create({
        title,
        description,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        fileType,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageKey: saved.storageKey,
        category,
        folderId,
        uploadedBy: user._id,
        department,
        visibility,
        allowedRoles,
        allowedUsers,
        status,
        version: 1,
        isPinned,
        pinnedAt: isPinned ? new Date() : null,
        tags
      });

      // Create Initial Version 1 record
      await DocumentVersionModel.create({
        documentId: doc._id,
        version: 1,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageKey: saved.storageKey,
        changeNotes: body.changeNotes || 'Initial version',
        uploadedBy: user._id
      });

      // Log activity
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_CREATED', {
        title: doc.title,
        version: 1
      });
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_UPLOADED', {
        fileName: saved.fileName,
        size: saved.fileSize
      });

      // Notifications: If published and important, notify relevant users
      if (status === 'PUBLISHED') {
        const notifUsers = await UserModel.find({
          _id: { $ne: user._id },
          isActive: true
        }).select('_id role department');

        const recipients = notifUsers.filter(u => canAccessDocument(u, doc)).slice(0, 100);

        for (const recipient of recipients) {
          await NotificationModel.create({
            recipientId: recipient._id,
            senderId: user._id,
            type: 'DOCUMENT_PUBLISHED',
            title: `New Document: ${doc.title}`,
            message: `${user.name} published a new ${doc.category} document: "${doc.title}"`,
            relatedEntityType: 'DOCUMENT',
            relatedEntityId: doc._id
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Document uploaded and published successfully',
        data: doc
      });
    } catch (error: any) {
      console.error('[DocumentController.createDocument] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create document', error: error.message });
    }
  }

  // PATCH /api/documents/:id
  async updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canManageDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Not authorized to edit this document' });
        return;
      }

      const {
        title,
        description,
        category,
        department,
        folderId,
        visibility,
        status,
        isPinned,
        tags
      } = req.body;

      if (title !== undefined) doc.title = title.trim();
      if (description !== undefined) doc.description = description.trim();
      if (category !== undefined) doc.category = category.toUpperCase();
      if (department !== undefined) doc.department = department.trim();
      if (folderId !== undefined) {
        doc.folderId = folderId && Types.ObjectId.isValid(folderId) ? new Types.ObjectId(folderId) : null;
      }
      if (visibility !== undefined) doc.visibility = visibility.toUpperCase();
      if (status !== undefined) doc.status = status.toUpperCase();
      if (isPinned !== undefined) {
        const pinVal = isPinned === true || isPinned === 'true';
        if (pinVal && !doc.isPinned) {
          doc.pinnedAt = new Date();
          await logDocumentActivity(doc._id, user._id, 'DOCUMENT_PINNED');
        } else if (!pinVal && doc.isPinned) {
          doc.pinnedAt = null;
        }
        doc.isPinned = pinVal;
      }
      if (tags !== undefined) {
        if (Array.isArray(tags)) {
          doc.tags = tags.map((t: string) => t.toLowerCase().trim()).filter(Boolean);
        } else if (typeof tags === 'string') {
          doc.tags = tags.split(',').map((t: string) => t.toLowerCase().trim()).filter(Boolean);
        }
      }

      await doc.save();
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_UPDATED', {
        fields: Object.keys(req.body)
      });

      res.json({
        success: true,
        message: 'Document updated successfully',
        data: doc
      });
    } catch (error: any) {
      console.error('[DocumentController.updateDocument] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update document', error: error.message });
    }
  }

  // DELETE /api/documents/:id
  async deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canManageDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this document' });
        return;
      }

      doc.isDeleted = true;
      doc.deletedAt = new Date();
      doc.status = 'ARCHIVED';
      await doc.save();

      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_ARCHIVED');

      res.json({
        success: true,
        message: 'Document archived successfully'
      });
    } catch (error: any) {
      console.error('[DocumentController.deleteDocument] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete document', error: error.message });
    }
  }

  // GET /api/documents/:id/download
  async downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied: You do not have permission to download this document' });
        return;
      }

      // Increment download counter atomically & log
      await DocumentModel.updateOne({ _id: doc._id }, { $inc: { downloadsCount: 1 } });
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_DOWNLOADED');

      const storage = getStorageProvider();
      const fileData = await storage.getFileStream(doc.storageKey);

      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
      if (fileData.fileSize) {
        res.setHeader('Content-Length', fileData.fileSize);
      }

      fileData.stream.pipe(res);
    } catch (error: any) {
      console.error('[DocumentController.downloadDocument] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to stream document file', error: error.message });
    }
  }

  // GET /api/documents/:id/preview
  async previewDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied: Preview not permitted' });
        return;
      }

      const storage = getStorageProvider();
      const fileData = await storage.getFileStream(doc.storageKey);

      res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
      if (fileData.fileSize) {
        res.setHeader('Content-Length', fileData.fileSize);
      }

      fileData.stream.pipe(res);
    } catch (error: any) {
      console.error('[DocumentController.previewDocument] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to preview document file', error: error.message });
    }
  }

  // POST /api/documents/:id/versions
  async createVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canManageDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Not authorized to upload new versions of this document' });
        return;
      }

      const file = (req as any).file;
      const body = req.body;

      let fileName = body.fileName || (file ? file.originalname : '');
      let mimeType = body.mimeType || (file ? file.mimetype : 'application/octet-stream');
      let fileSize = file ? file.size : parseInt(body.fileSize || '0', 10);
      let fileBuffer = file ? file.buffer : (body.fileBuffer ? Buffer.from(body.fileBuffer, 'base64') : null);

      if (!fileName || !fileBuffer) {
        res.status(400).json({ success: false, message: 'New version file and file name are required' });
        return;
      }

      const ext = ('.' + (fileName.split('.').pop() || '')).toLowerCase();
      if (UNSAFE_EXTENSIONS.includes(ext)) {
        res.status(400).json({ success: false, message: `Disallowed unsafe file format (${ext})` });
        return;
      }

      const storage = getStorageProvider();
      const saved = await storage.saveFile(fileBuffer, fileName, mimeType, 'documents');

      const newVersionNum = (doc.version || 1) + 1;

      // Create version record
      const versionRecord = await DocumentVersionModel.create({
        documentId: doc._id,
        version: newVersionNum,
        fileName: saved.fileName,
        fileUrl: saved.fileUrl,
        mimeType: saved.mimeType,
        fileSize: saved.fileSize,
        storageKey: saved.storageKey,
        changeNotes: body.changeNotes || `Version ${newVersionNum} uploaded`,
        uploadedBy: user._id
      });

      // Update parent document's pointer
      doc.version = newVersionNum;
      doc.fileName = saved.fileName;
      doc.fileUrl = saved.fileUrl;
      doc.fileType = determineFileType(saved.mimeType, saved.fileName);
      doc.mimeType = saved.mimeType;
      doc.fileSize = saved.fileSize;
      doc.storageKey = saved.storageKey;
      await doc.save();

      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_VERSION_CREATED', {
        version: newVersionNum,
        notes: body.changeNotes
      });

      res.status(201).json({
        success: true,
        message: `Version ${newVersionNum} created successfully`,
        data: {
          document: doc,
          version: versionRecord
        }
      });
    } catch (error: any) {
      console.error('[DocumentController.createVersion] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create document version', error: error.message });
    }
  }

  // GET /api/documents/:id/versions
  async getDocumentVersions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const versions = await DocumentVersionModel.find({ documentId: doc._id })
        .sort({ version: -1 })
        .populate('uploadedBy', 'name role department profilePhoto');

      res.json({
        success: true,
        data: versions
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocumentVersions] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve document versions', error: error.message });
    }
  }

  // GET /api/documents/:id/versions/:versionNum/download
  async downloadSpecificVersion(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id, versionNum } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const version = await DocumentVersionModel.findOne({
        documentId: doc._id,
        version: parseInt(versionNum, 10)
      });

      if (!version) {
        res.status(404).json({ success: false, message: 'Version not found' });
        return;
      }

      const storage = getStorageProvider();
      const fileData = await storage.getFileStream(version.storageKey);

      res.setHeader('Content-Type', version.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(version.fileName)}"`);
      if (fileData.fileSize) {
        res.setHeader('Content-Length', fileData.fileSize);
      }

      fileData.stream.pipe(res);
    } catch (error: any) {
      console.error('[DocumentController.downloadSpecificVersion] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to download specific version', error: error.message });
    }
  }

  // GET /api/documents/:id/access
  async getDocumentAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id)
        .populate('allowedUsers', 'name email role department profilePhoto')
        .populate('uploadedBy', 'name role department');

      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      res.json({
        success: true,
        data: {
          visibility: doc.visibility,
          department: doc.department,
          allowedRoles: doc.allowedRoles,
          allowedUsers: doc.allowedUsers,
          allowedDepartments: doc.allowedDepartments,
          allowedTeams: doc.allowedTeams,
          uploadedBy: doc.uploadedBy
        }
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocumentAccess] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve access settings', error: error.message });
    }
  }

  // PATCH /api/documents/:id/access
  async updateAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canManageDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Not authorized to configure document access' });
        return;
      }

      const { visibility, allowedRoles, allowedUsers, allowedDepartments, allowedTeams } = req.body;

      if (visibility) doc.visibility = visibility.toUpperCase();
      if (allowedRoles !== undefined) doc.allowedRoles = (allowedRoles || []).map((r: string) => r.toUpperCase());
      if (allowedUsers !== undefined) {
        doc.allowedUsers = (allowedUsers || []).filter((u: string) => Types.ObjectId.isValid(u)).map((u: string) => new Types.ObjectId(u));
      }
      if (allowedDepartments !== undefined) doc.allowedDepartments = allowedDepartments || [];
      if (allowedTeams !== undefined) doc.allowedTeams = allowedTeams || [];

      await doc.save();
      await logDocumentActivity(doc._id, user._id, 'DOCUMENT_SHARED', {
        visibility: doc.visibility,
        allowedRoles: doc.allowedRoles,
        allowedUsersCount: doc.allowedUsers.length
      });

      // Send notifications to explicitly added users
      if (Array.isArray(allowedUsers)) {
        for (const targetUserId of allowedUsers) {
          if (targetUserId.toString() !== user._id.toString()) {
            await NotificationModel.create({
              recipientId: targetUserId,
              senderId: user._id,
              type: 'DOCUMENT_SHARED',
              title: `Document Shared: ${doc.title}`,
              message: `${user.name} shared the document "${doc.title}" with you`,
              relatedEntityType: 'DOCUMENT',
              relatedEntityId: doc._id
            });
          }
        }
      }

      res.json({
        success: true,
        message: 'Document access permissions updated successfully',
        data: doc
      });
    } catch (error: any) {
      console.error('[DocumentController.updateAccess] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update document access', error: error.message });
    }
  }

  // POST /api/documents/:id/favorite
  async toggleFavorite(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const existing = await DocumentFavoriteModel.findOne({
        userId: user._id,
        documentId: doc._id
      });

      let isFavorited: boolean;
      if (existing) {
        await DocumentFavoriteModel.deleteOne({ _id: existing._id });
        isFavorited = false;
      } else {
        await DocumentFavoriteModel.create({
          userId: user._id,
          documentId: doc._id
        });
        isFavorited = true;
      }

      res.json({
        success: true,
        data: { isFavorited }
      });
    } catch (error: any) {
      console.error('[DocumentController.toggleFavorite] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to toggle favorite', error: error.message });
    }
  }

  // GET /api/documents/favorites
  async getFavorites(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const favorites = await DocumentFavoriteModel.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .populate({
          path: 'documentId',
          populate: [
            { path: 'uploadedBy', select: 'name role department profilePhoto' },
            { path: 'folderId', select: 'name depth' }
          ]
        })
        .lean();

      const validDocs = favorites
        .map((f: any) => f.documentId)
        .filter((doc: any) => doc && !doc.isDeleted && canAccessDocument(user, doc))
        .map((doc: any) => ({ ...doc, isFavorited: true }));

      res.json({
        success: true,
        data: validDocs
      });
    } catch (error: any) {
      console.error('[DocumentController.getFavorites] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve favorites', error: error.message });
    }
  }

  // GET /api/documents/:id/activity
  async getDocumentActivity(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const doc = await DocumentModel.findById(id);
      if (!doc || doc.isDeleted) {
        res.status(404).json({ success: false, message: 'Document not found' });
        return;
      }

      if (!canAccessDocument(user, doc)) {
        res.status(403).json({ success: false, message: 'Access denied' });
        return;
      }

      const activities = await DocumentActivityModel.find({ documentId: doc._id })
        .sort({ createdAt: -1 })
        .limit(30)
        .populate('userId', 'name role department profilePhoto');

      res.json({
        success: true,
        data: activities
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocumentActivity] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve document activity', error: error.message });
    }
  }

  // GET /api/documents/summary
  async getDocumentSummary(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const allDocs = await DocumentModel.find({
        isDeleted: false,
        status: { $ne: 'ARCHIVED' }
      })
        .sort({ updatedAt: -1 })
        .populate('uploadedBy', 'name role department profilePhoto')
        .populate('folderId', 'name depth')
        .lean();

      const permitted = allDocs.filter((doc: any) => canAccessDocument(user, doc));

      const totalPublished = permitted.filter((d: any) => d.status === 'PUBLISHED').length;
      const importantDocuments = permitted.filter((d: any) => d.isPinned).slice(0, 6);
      const recentlyUpdated = permitted.slice(0, 6);

      // Category breakdown
      const categoryCounts: Record<string, number> = {};
      permitted.forEach((d: any) => {
        categoryCounts[d.category] = (categoryCounts[d.category] || 0) + 1;
      });

      // Favorites count
      const myFavoritesCount = await DocumentFavoriteModel.countDocuments({ userId: user._id });

      res.json({
        success: true,
        data: {
          totalPublished,
          importantDocuments,
          recentlyUpdated,
          categoryCounts,
          myFavoritesCount
        }
      });
    } catch (error: any) {
      console.error('[DocumentController.getDocumentSummary] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve document summary', error: error.message });
    }
  }
}

export const documentController = new DocumentController();
