import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';
import { DocumentVisibility } from './Document';

export interface IDocumentFolder extends MongooseDocument {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  parentFolderId?: Types.ObjectId | null;
  createdBy: Types.ObjectId;
  department: string;
  visibility: DocumentVisibility;
  allowedRoles: string[];
  allowedUsers: Types.ObjectId[];
  allowedDepartments: string[];
  allowedTeams: string[];
  depth: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFolderSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, default: '', trim: true },
    parentFolderId: {
      type: Schema.Types.ObjectId,
      ref: 'DocumentFolder',
      default: null,
      index: true
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    department: { type: String, default: 'General', trim: true, index: true },
    visibility: {
      type: String,
      enum: ['COMPANY', 'DEPARTMENT', 'TEAM', 'ROLE', 'PRIVATE'],
      default: 'COMPANY',
      required: true
    },
    allowedRoles: { type: [String], default: [] },
    allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    allowedDepartments: { type: [String], default: [] },
    allowedTeams: { type: [String], default: [] },
    depth: { type: Number, default: 1, min: 1, max: 5 },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  {
    timestamps: true
  }
);

DocumentFolderSchema.index({ parentFolderId: 1, isDeleted: 1 });
DocumentFolderSchema.index({ department: 1, visibility: 1, isDeleted: 1 });

export const DocumentFolderModel =
  mongoose.models.DocumentFolder ||
  mongoose.model<IDocumentFolder>('DocumentFolder', DocumentFolderSchema);
