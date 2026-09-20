import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

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

export interface IDocumentItem extends MongooseDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  fileName: string;
  fileUrl: string;
  fileType: DocumentFileType;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  category: DocumentCategory;
  folderId?: Types.ObjectId | null;
  uploadedBy: Types.ObjectId;
  department: string;
  visibility: DocumentVisibility;
  allowedRoles: string[];
  allowedUsers: Types.ObjectId[];
  allowedDepartments: string[];
  allowedTeams: string[];
  status: DocumentStatus;
  version: number;
  isPinned: boolean;
  pinnedAt?: Date | null;
  tags: string[];
  viewsCount: number;
  downloadsCount: number;
  isDeleted: boolean;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 250 },
    description: { type: String, default: '', trim: true },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    fileType: {
      type: String,
      enum: ['PDF', 'IMAGE', 'DOC', 'SHEET', 'TEXT', 'OTHER'],
      default: 'OTHER',
      required: true
    },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    category: {
      type: String,
      enum: [
        'POLICY',
        'SOP',
        'GUIDE',
        'TEMPLATE',
        'REPORT',
        'HR',
        'FINANCE',
        'MARKETING',
        'TECHNICAL',
        'GENERAL',
        'OTHER'
      ],
      default: 'GENERAL',
      required: true,
      index: true
    },
    folderId: { type: Schema.Types.ObjectId, ref: 'DocumentFolder', default: null, index: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: String, default: 'General', trim: true, index: true },
    visibility: {
      type: String,
      enum: ['COMPANY', 'DEPARTMENT', 'TEAM', 'ROLE', 'PRIVATE'],
      default: 'COMPANY',
      required: true,
      index: true
    },
    allowedRoles: { type: [String], default: [] },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedDepartments: { type: [String], default: [] },
    allowedTeams: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
      required: true,
      index: true
    },
    version: { type: Number, default: 1, min: 1 },
    isPinned: { type: Boolean, default: false, index: true },
    pinnedAt: { type: Date, default: null },
    tags: { type: [String], default: [], index: true },
    viewsCount: { type: Number, default: 0 },
    downloadsCount: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  {
    timestamps: true
  }
);

// Indexes for high performance searches and filters
DocumentSchema.index({ title: 'text', description: 'text', tags: 'text', fileName: 'text' });
DocumentSchema.index({ category: 1, status: 1, isDeleted: 1 });
DocumentSchema.index({ folderId: 1, isDeleted: 1 });
DocumentSchema.index({ department: 1, visibility: 1, isDeleted: 1 });
DocumentSchema.index({ isPinned: -1, updatedAt: -1 });

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDocumentItem>('Document', DocumentSchema);
