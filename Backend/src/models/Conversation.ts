import mongoose, { Schema, Document, Types } from 'mongoose';

export type ConversationType = 'DIRECT' | 'GROUP' | 'COMPANY';

export interface ILastMessage {
  text: string;
  senderId: Types.ObjectId;
  senderName: string;
  createdAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  type: ConversationType;
  name: string;
  avatar?: string;
  participants: Types.ObjectId[];
  createdBy?: Types.ObjectId;
  lastMessage?: ILastMessage;
  lastMessageAt: Date;
  unreadCounts: Record<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const LastMessageSchema = new Schema(
  {
    text: { type: String, default: '' },
    senderId: { type: Schema.Types.ObjectId, ref: 'User' },
    senderName: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const ConversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['DIRECT', 'GROUP', 'COMPANY'],
      default: 'DIRECT',
      required: true,
      index: true
    },
    name: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
      }
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    lastMessage: {
      type: LastMessageSchema,
      default: null
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    unreadCounts: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

ConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const ConversationModel = mongoose.model<IConversation>('Conversation', ConversationSchema);
