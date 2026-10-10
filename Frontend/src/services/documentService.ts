import { apiClient, getAuthToken, buildApiUrl } from './apiClient';

export type DocumentCategory =
  | 'POLICY'
  | 'SOP'
  | 'GUIDE'
  | 'TEMPLATE'
  | 'REPORT'
  | 'HR'
  | 'FINANCE'
  | 'MARKETING'
  | 'TECHNICAL'
  | 'GENERAL'
  | 'OTHER';

export type DocumentVisibility = 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'ROLE' | 'PRIVATE';
export type DocumentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type DocumentFileType = 'PDF' | 'IMAGE' | 'DOC' | 'SHEET' | 'TEXT' | 'OTHER';

export interface DocumentItem {
  _id: string;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: DocumentFileType;
  mimeType: string;
  fileSize: number;
  category: DocumentCategory;
  folderId?: {
    _id: string;
    name: string;
    depth?: number;
    parentFolderId?: string;
  } | null;
  uploadedBy: {
    _id: string;
    name: string;
    role: string;
    department: string;
    profilePhoto?: string;
  };
  department: string;
  visibility: DocumentVisibility;
  allowedRoles: string[];
  allowedUsers?: Array<{
    _id: string;
    name: string;
    role: string;
    department: string;
    profilePhoto?: string;
  }>;
  allowedDepartments?: string[];
  allowedTeams?: string[];
  status: DocumentStatus;
  version: number;
  isPinned: boolean;
  pinnedAt?: string | null;
  tags: string[];
  viewsCount: number;
  downloadsCount: number;
  isFavorited?: boolean;
  canManage?: boolean;
  versions?: DocumentVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface DocumentFolder {
  _id: string;
  name: string;
  description?: string;
  parentFolderId?: string | null;
  createdBy: {
    _id: string;
    name: string;
    role: string;
    department: string;
    profilePhoto?: string;
  };
  department: string;
  visibility: DocumentVisibility;
  allowedRoles: string[];
  allowedUsers?: string[];
  depth: number;
  documentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentVersion {
  _id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  changeNotes?: string;
  uploadedBy: {
    _id: string;
    name: string;
    role: string;
    profilePhoto?: string;
  };
  createdAt: string;
}

export interface DocumentActivity {
  _id: string;
  documentId: string;
  userId: {
    _id: string;
    name: string;
    role: string;
    department: string;
    profilePhoto?: string;
  };
  type: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface DocumentSummary {
  totalPublished: number;
  importantDocuments: DocumentItem[];
  recentlyUpdated: DocumentItem[];
  categoryCounts: Record<string, number>;
  myFavoritesCount: number;
}

export const documentService = {
  // Documents
  async getDocuments(params: Record<string, any> = {}): Promise<{ data: DocumentItem[]; pagination: any }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return await apiClient<{ success: boolean; data: DocumentItem[]; pagination: any }>(
      `/api/documents?${query.toString()}`
    );
  },

  async searchDocuments(q: string): Promise<DocumentItem[]> {
    if (!q.trim()) return [];
    const res = await apiClient<{ success: boolean; data: DocumentItem[] }>(
      `/api/documents/search?q=${encodeURIComponent(q)}`
    );
    return res.data;
  },

  async getDocumentById(id: string): Promise<DocumentItem> {
    const res = await apiClient<{ success: boolean; data: DocumentItem }>(`/api/documents/${id}`);
    return res.data;
  },

  async createDocument(formData: FormData): Promise<DocumentItem> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(buildApiUrl('/api/documents'), {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to upload document');
    }
    return data.data;
  },

  async updateDocument(id: string, updates: Partial<DocumentItem>): Promise<DocumentItem> {
    const res = await apiClient<{ success: boolean; data: DocumentItem }>(
      `/api/documents/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );
    return res.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient<{ success: boolean }>(`/api/documents/${id}`, {
      method: 'DELETE'
    });
  },

  getDownloadUrl(id: string): string {
    return buildApiUrl(`/api/documents/${id}/download`);
  },

  getPreviewUrl(id: string): string {
    return buildApiUrl(`/api/documents/${id}/preview`);
  },

  // Versioning
  async createVersion(id: string, formData: FormData): Promise<{ document: DocumentItem; version: DocumentVersion }> {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(buildApiUrl(`/api/documents/${id}/versions`), {
      method: 'POST',
      headers,
      body: formData
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.message || 'Failed to create document version');
    }
    return data.data;
  },

  async getVersions(id: string): Promise<DocumentVersion[]> {
    const res = await apiClient<{ success: boolean; data: DocumentVersion[] }>(
      `/api/documents/${id}/versions`
    );
    return res.data;
  },

  getVersionDownloadUrl(id: string, versionNum: number): string {
    return `/api/documents/${id}/versions/${versionNum}/download`;
  },

  // Access & Sharing
  async getDocumentAccess(id: string): Promise<any> {
    const res = await apiClient<{ success: boolean; data: any }>(`/api/documents/${id}/access`);
    return res.data;
  },

  async updateDocumentAccess(id: string, accessData: any): Promise<DocumentItem> {
    const res = await apiClient<{ success: boolean; data: DocumentItem }>(
      `/api/documents/${id}/access`,
      {
        method: 'PATCH',
        body: JSON.stringify(accessData)
      }
    );
    return res.data;
  },

  // Favorites
  async toggleFavorite(id: string): Promise<boolean> {
    const res = await apiClient<{ success: boolean; data: { isFavorited: boolean } }>(
      `/api/documents/${id}/favorite`,
      { method: 'POST' }
    );
    return res.data.isFavorited;
  },

  async getFavorites(): Promise<DocumentItem[]> {
    const res = await apiClient<{ success: boolean; data: DocumentItem[] }>(
      '/api/documents/favorites'
    );
    return res.data;
  },

  // Activity & Summary
  async getDocumentActivity(id: string): Promise<DocumentActivity[]> {
    const res = await apiClient<{ success: boolean; data: DocumentActivity[] }>(
      `/api/documents/${id}/activity`
    );
    return res.data;
  },

  async getDocumentSummary(): Promise<DocumentSummary> {
    const res = await apiClient<{ success: boolean; data: DocumentSummary }>(
      '/api/documents/summary'
    );
    return res.data;
  },

  // Folders
  async getFolders(params: Record<string, any> = {}): Promise<DocumentFolder[]> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const res = await apiClient<{ success: boolean; data: DocumentFolder[] }>(
      `/api/document-folders?${query.toString()}`
    );
    return res.data;
  },

  async getFolderById(id: string): Promise<DocumentFolder & { breadcrumbs: Array<{ id: string; name: string }>; canManage: boolean }> {
    const res = await apiClient<{ success: boolean; data: any }>(`/api/document-folders/${id}`);
    return res.data;
  },

  async createFolder(data: {
    name: string;
    description?: string;
    parentFolderId?: string | null;
    department?: string;
    visibility?: DocumentVisibility;
    allowedRoles?: string[];
  }): Promise<DocumentFolder> {
    const res = await apiClient<{ success: boolean; data: DocumentFolder }>(
      '/api/document-folders',
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    );
    return res.data;
  },

  async updateFolder(id: string, data: Partial<DocumentFolder>): Promise<DocumentFolder> {
    const res = await apiClient<{ success: boolean; data: DocumentFolder }>(
      `/api/document-folders/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    );
    return res.data;
  },

  async deleteFolder(id: string): Promise<void> {
    await apiClient<{ success: boolean }>(`/api/document-folders/${id}`, {
      method: 'DELETE'
    });
  }
};

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
