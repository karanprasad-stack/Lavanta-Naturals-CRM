export type ConversationType = 'DIRECT' | 'GROUP' | 'COMPANY';
export type ChatMessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';

export interface ChatParticipant {
  _id: string;
  id?: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  designation?: string;
  profilePhoto?: string;
  status?: string;
}

export interface ChatAttachment {
  filename: string;
  fileType?: string;
  size?: number;
  url: string;
}

export interface ChatMessage {
  _id: string;
  id?: string;
  conversationId: string;
  senderId: ChatParticipant | string;
  content: string;
  messageType: ChatMessageType;
  attachments?: ChatAttachment[];
  replyTo?: {
    _id: string;
    content: string;
    senderId: any;
    createdAt: string;
  } | null;
  readBy: string[];
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  id?: string;
  type: ConversationType;
  name: string;
  avatar?: string;
  participants?: ChatParticipant[];
  otherUser?: ChatParticipant;
  isOnline?: boolean;
  participantCount?: number;
  lastMessage?: {
    text: string;
    senderId: string;
    senderName: string;
    createdAt: string;
  } | null;
  lastMessageAt: string;
  unreadCount: number;
}
