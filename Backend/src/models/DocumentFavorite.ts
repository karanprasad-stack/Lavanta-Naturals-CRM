import mongoose, { Schema, Document as MongooseDocument, Types } from 'mongoose';

export interface IDocumentFavorite extends MongooseDocument {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  documentId: Types.ObjectId;
  createdAt: Date;
}

const DocumentFavoriteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    documentId: { type: Schema.Types.ObjectId, ref: 'Document', required: true, index: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Prevent duplicate favorites per user/document
DocumentFavoriteSchema.index({ userId: 1, documentId: 1 }, { unique: true });

export const DocumentFavoriteModel =
  mongoose.models.DocumentFavorite ||
  mongoose.model<IDocumentFavorite>('DocumentFavorite', DocumentFavoriteSchema);
