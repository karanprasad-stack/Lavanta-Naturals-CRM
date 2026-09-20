import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export type DocumentActivityType =
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_UPDATED'
  | 'DOCUMENT_VIEWED'
  | 'DOCUMENT_DOWNLOADED'
  | 'DOCUMENT_SHARED'
  | 'DOCUMENT_PUBLISHED'
  | 'DOCUMENT_ARCHIVED'
  | 'DOCUMENT_VERSION_CREATED'
  | 'DOCUMENT_PINNED';

export interface IDocumentActivity extends MongooseDocument {
  _id: Types.ObjectId;
  documentId: Types.ObjectId;
  userId: Types.ObjectId;
  type: DocumentActivityType;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const DocumentActivitySchema = new Schema(
  {
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'DOCUMENT_CREATED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_UPDATED',
        'DOCUMENT_VIEWED',
        'DOCUMENT_DOWNLOADED',
        'DOCUMENT_SHARED',
        'DOCUMENT_PUBLISHED',
        'DOCUMENT_ARCHIVED',
        'DOCUMENT_VERSION_CREATED',
        'DOCUMENT_PINNED'
      ],
      required: true,
      index: true
    },
    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

DocumentActivitySchema.index({ documentId: 1, createdAt: -1 });
DocumentActivitySchema.index({ userId: 1, createdAt: -1 });

export const DocumentActivityModel =
  mongoose.models.DocumentActivity ||
  mongoose.model<IDocumentActivity>('DocumentActivity', DocumentActivitySchema);
