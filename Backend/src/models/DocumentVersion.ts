import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export interface IDocumentVersion extends MongooseDocument {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  version: number;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  storageKey: string;
  changeNotes?: string;
  uploadedBy: Types.ObjectId;
  createdAt: Date;
}

const DocumentVersionSchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    version: { type: Number, required: true, min: 1 },
    fileName: { type: String, required: true, trim: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true, min: 0 },
    storageKey: { type: String, required: true },
    changeNotes: { type: String, default: '', trim: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

DocumentVersionSchema.index({ documentId: 1, version: -1 });

export const DocumentVersionModel =
  mongoose.models.DocumentVersion ||
  mongoose.model<IDocumentVersion>('DocumentVersion', DocumentVersionSchema);
