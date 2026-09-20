export type AnnouncementType = 'GENERAL' | 'EVENT' | 'MEETING' | 'IMPORTANT' | 'NOTICE';
export type AnnouncementPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type AnnouncementTargetType = 'EVERYONE' | 'ROLE' | 'DEPARTMENT' | 'USERS';
export type AnnouncementStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface AnnouncementAttachment {
  filename: string;
  fileType?: string;
  size?: number;
  url: string;
}

export interface AnnouncementAuthor {
  _id: string;
  name: string;
  email?: string;
  role: string;
  department?: string;
  designation?: string;
  profilePhoto?: string;
}

export interface Announcement {
  _id: string;
  id?: string;
  title: string;
  description: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  createdBy: AnnouncementAuthor;
  targetType: AnnouncementTargetType;
  targetRoles: string[];
  targetDepartments: string[];
  targetUsers: string[];
  posterImage?: string;
  attachments: AnnouncementAttachment[];
  publishedAt: string;
  expiresAt?: string | null;
  status: AnnouncementStatus;
  isRead?: boolean;
  readAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementPayload {
  title: string;
  description: string;
  content?: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  targetType: AnnouncementTargetType;
  targetRoles?: string[];
  targetDepartments?: string[];
  targetUsers?: string[];
  posterImage?: string;
  attachments?: AnnouncementAttachment[];
  expiresAt?: string | null;
}

export interface ReadReceiptUser {
  user: {
    _id: string;
    name: string;
    email: string;
    role: string;
    department?: string;
    designation?: string;
    profilePhoto?: string;
  };
  readAt?: string;
}

export interface AnnouncementReadReceipts {
  announcementId: string;
  totalTargeted: number;
  readCount: number;
  unreadCount: number;
  readRatio: string;
  percentage: number;
  readUsers: ReadReceiptUser[];
  unreadUsers: ReadReceiptUser[];
}
