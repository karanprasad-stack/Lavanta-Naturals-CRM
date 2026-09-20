import { Response } from 'express';
import { Types } from 'mongoose';
import { AuthenticatedRequest } from '../middleware/auth';
import { DocumentFolderModel, IDocumentFolder } from '../models/DocumentFolder';
import { DocumentModel } from '../models/Document';

export function canAccessFolder(user: any, folder: IDocumentFolder): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (role === 'FOUNDER') return true;

  if (folder.visibility === 'PRIVATE') {
    return folder.createdBy && folder.createdBy.toString() === user._id.toString();
  }

  if (folder.allowedUsers && folder.allowedUsers.some((uid: any) => uid.toString() === user._id.toString())) {
    return true;
  }

  if (folder.visibility === 'ROLE') {
    return (folder.allowedRoles || []).map(r => r.toUpperCase()).includes(role);
  }

  if (folder.visibility === 'DEPARTMENT') {
    const userDept = (user.department || '').toLowerCase();
    const folderDept = (folder.department || '').toLowerCase();
    if (userDept && userDept === folderDept) return true;
    if ((folder.allowedDepartments || []).map(d => d.toLowerCase()).includes(userDept)) return true;
    return role === 'HR';
  }

  if (folder.visibility === 'TEAM') {
    const userTeam = (user.team || user.department || '').toLowerCase();
    const folderDept = (folder.department || '').toLowerCase();
    if (userTeam && userTeam === folderDept) return true;
    if ((folder.allowedTeams || []).map(t => t.toLowerCase()).includes(userTeam)) return true;
    return role === 'HR';
  }

  if (folder.visibility === 'COMPANY') {
    if (folder.allowedRoles && folder.allowedRoles.length > 0) {
      return folder.allowedRoles.map(r => r.toUpperCase()).includes(role);
    }
    return true;
  }

  return false;
}

export function canManageFolder(user: any, folder: IDocumentFolder): boolean {
  if (!user) return false;
  const role = (user.role || '').toUpperCase();
  if (role === 'FOUNDER') return true;
  if (folder.createdBy && folder.createdBy.toString() === user._id.toString()) return true;
  if (role === 'HR' && (folder.department === 'HR' || folder.visibility === 'COMPANY')) return true;
  if (role === 'MANAGER' && (user.department || '').toLowerCase() === (folder.department || '').toLowerCase()) return true;
  return false;
}

export class DocumentFolderController {
  // GET /api/document-folders
  async getFolders(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { parentFolderId, department } = req.query;
      const filter: any = { isDeleted: false };

      if (parentFolderId !== undefined) {
        filter.parentFolderId = parentFolderId === 'null' || parentFolderId === '' ? null : new Types.ObjectId(parentFolderId as string);
      }

      if (department) {
        filter.department = department;
      }

      const folders = await DocumentFolderModel.find(filter)
        .sort({ name: 1 })
        .populate('createdBy', 'name role department profilePhoto')
        .lean();

      const permittedFolders = folders.filter((f: any) => canAccessFolder(user, f));

      // Fetch document counts per folder
      const folderIds = permittedFolders.map((f: any) => f._id);
      const docCounts = await DocumentModel.aggregate([
        { $match: { folderId: { $in: folderIds }, isDeleted: false, status: { $ne: 'ARCHIVED' } } },
        { $group: { _id: '$folderId', count: { $sum: 1 } } }
      ]);

      const countMap: Record<string, number> = {};
      docCounts.forEach((c: any) => {
        if (c._id) countMap[c._id.toString()] = c.count;
      });

      const enriched = permittedFolders.map((f: any) => ({
        ...f,
        documentCount: countMap[f._id.toString()] || 0
      }));

      res.json({
        success: true,
        data: enriched
      });
    } catch (error: any) {
      console.error('[DocumentFolderController.getFolders] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve folders', error: error.message });
    }
  }

  // GET /api/document-folders/:id
  async getFolderById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      if (!Types.ObjectId.isValid(id)) {
        res.status(400).json({ success: false, message: 'Invalid folder ID' });
        return;
      }

      const folder = await DocumentFolderModel.findById(id)
        .populate('createdBy', 'name role department profilePhoto')
        .populate('parentFolderId', 'name depth parentFolderId');

      if (!folder || folder.isDeleted) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }

      if (!canAccessFolder(user, folder)) {
        res.status(403).json({ success: false, message: 'Access denied: You do not have permission to access this folder' });
        return;
      }

      // Build breadcrumbs
      const breadcrumbs: Array<{ id: string; name: string }> = [];
      let currParent: any = folder;
      while (currParent) {
        breadcrumbs.unshift({ id: currParent._id.toString(), name: currParent.name });
        if (currParent.parentFolderId) {
          currParent = await DocumentFolderModel.findById(currParent.parentFolderId);
        } else {
          currParent = null;
        }
      }

      res.json({
        success: true,
        data: {
          ...folder.toObject(),
          breadcrumbs,
          canManage: canManageFolder(user, folder)
        }
      });
    } catch (error: any) {
      console.error('[DocumentFolderController.getFolderById] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve folder details', error: error.message });
    }
  }

  // POST /api/document-folders
  async createFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const role = (user.role || '').toUpperCase();
      if (role !== 'FOUNDER' && role !== 'HR' && role !== 'MANAGER') {
        res.status(403).json({ success: false, message: 'Only Founder, HR, and Managers can create document folders' });
        return;
      }

      const { name, description, parentFolderId, department, visibility, allowedRoles, allowedUsers } = req.body;

      if (!name || !name.trim()) {
        res.status(400).json({ success: false, message: 'Folder name is required' });
        return;
      }

      let depth = 1;
      let parentObjId: Types.ObjectId | null = null;

      if (parentFolderId && Types.ObjectId.isValid(parentFolderId)) {
        const parent = await DocumentFolderModel.findById(parentFolderId);
        if (!parent || parent.isDeleted) {
          res.status(404).json({ success: false, message: 'Parent folder not found' });
          return;
        }

        if (parent.depth >= 4) {
          res.status(400).json({
            success: false,
            message: 'Folder depth limit reached. Maximum nesting depth is 4 levels.'
          });
          return;
        }

        depth = parent.depth + 1;
        parentObjId = parent._id;
      }

      const folder = await DocumentFolderModel.create({
        name: name.trim(),
        description: (description || '').trim(),
        parentFolderId: parentObjId,
        createdBy: user._id,
        department: department || user.department || 'General',
        visibility: (visibility || 'COMPANY').toUpperCase(),
        allowedRoles: allowedRoles || [],
        allowedUsers: allowedUsers || [],
        depth
      });

      res.status(201).json({
        success: true,
        message: 'Folder created successfully',
        data: folder
      });
    } catch (error: any) {
      console.error('[DocumentFolderController.createFolder] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to create folder', error: error.message });
    }
  }

  // PATCH /api/document-folders/:id
  async updateFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const folder = await DocumentFolderModel.findById(id);
      if (!folder || folder.isDeleted) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }

      if (!canManageFolder(user, folder)) {
        res.status(403).json({ success: false, message: 'Not authorized to modify this folder' });
        return;
      }

      const { name, description, department, visibility, allowedRoles, allowedUsers } = req.body;

      if (name) folder.name = name.trim();
      if (description !== undefined) folder.description = description.trim();
      if (department) folder.department = department.trim();
      if (visibility) folder.visibility = visibility.toUpperCase();
      if (allowedRoles !== undefined) folder.allowedRoles = allowedRoles;
      if (allowedUsers !== undefined) folder.allowedUsers = allowedUsers;

      await folder.save();

      res.json({
        success: true,
        message: 'Folder updated successfully',
        data: folder
      });
    } catch (error: any) {
      console.error('[DocumentFolderController.updateFolder] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to update folder', error: error.message });
    }
  }

  // DELETE /api/document-folders/:id
  async deleteFolder(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = req.user;
      if (!user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const { id } = req.params;
      const folder = await DocumentFolderModel.findById(id);
      if (!folder || folder.isDeleted) {
        res.status(404).json({ success: false, message: 'Folder not found' });
        return;
      }

      if (!canManageFolder(user, folder)) {
        res.status(403).json({ success: false, message: 'Not authorized to delete this folder' });
        return;
      }

      // Check if active subfolders or documents exist
      const subfoldersCount = await DocumentFolderModel.countDocuments({
        parentFolderId: folder._id,
        isDeleted: false
      });
      const docsCount = await DocumentModel.countDocuments({
        folderId: folder._id,
        isDeleted: false
      });

      if (subfoldersCount > 0 || docsCount > 0) {
        res.status(400).json({
          success: false,
          message: `Cannot delete folder: It contains ${docsCount} active document(s) and ${subfoldersCount} subfolder(s). Please move or archive them first.`
        });
        return;
      }

      folder.isDeleted = true;
      await folder.save();

      res.json({
        success: true,
        message: 'Folder deleted successfully'
      });
    } catch (error: any) {
      console.error('[DocumentFolderController.deleteFolder] Error:', error);
      res.status(500).json({ success: false, message: 'Failed to delete folder', error: error.message });
    }
  }
}

export const documentFolderController = new DocumentFolderController();
