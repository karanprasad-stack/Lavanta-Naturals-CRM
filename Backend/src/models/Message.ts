import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface IMessageAttachment {
  filename: string;
  fileType?: string;
  size?: number;
  url: string;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  messageType: ChatMessageType;
  attachments: IMessageAttachment[];
  replyTo?: Types.ObjectId | null;
  readBy: Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date | null;
  isDeleted: boolean;
  deletedAt?: Date | null;
  deletedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema(
  {
    filename: { type: String, required: true },
    fileType: { type: String, default: 'application/octet-stream' },
    size: { type: Number, default: 0 },
    url: { type: String, required: true }
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    messageType: {
      type: String,
      enum: ['TEXT', 'IMAGE', 'FILE', 'SYSTEM'],
      default: 'TEXT',
      required: true
    },
    attachments: [AttachmentSchema],
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound index for paginating conversation messages chronologically
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Compound index for high-performance unread count aggregation
MessageSchema.index({ conversationId: 1, readBy: 1, senderId: 1, isDeleted: 1 });

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);
