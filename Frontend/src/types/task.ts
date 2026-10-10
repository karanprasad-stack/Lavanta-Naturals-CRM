export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';

export interface TaskUserSummary {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  designation?: string;
  profilePhoto?: string;
  avatar?: string;
  phone?: string;
}

export interface TaskComment {
  _id: string;
  author: TaskUserSummary;
  message: string;
  createdAt: string;
}

export interface TaskAttachment {
  _id: string;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  uploadedBy: TaskUserSummary;
  uploadedAt: string;
}

export interface TaskProofOfWork {
  _id: string;
  filename: string;
  fileType: string;
  size: number;
  url: string;
  comment?: string;
  uploadedBy: TaskUserSummary;
  uploadedAt: string;
}

export type AssignmentTargetType = 'INTERNS' | 'EMPLOYEES' | 'HR' | 'MEMBERS';

export interface Task {
  _id: string;
  id?: string;
  title: string;
  description: string;
  assignedTo?: TaskUserSummary;
  assignees?: TaskUserSummary[];
  assignedBy: TaskUserSummary;
  department: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline: string;
  assignedAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  comments: TaskComment[];
  attachments: TaskAttachment[];
  proofOfWork: TaskProofOfWork[];
  isOverdue?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCounters {
  all: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface TaskActivity {
  _id: string;
  taskId: string;
  actorId: TaskUserSummary;
  type:
    | 'TASK_CREATED'
    | 'TASK_ASSIGNED'
    | 'TASK_UPDATED'
    | 'TASK_STARTED'
    | 'TASK_COMPLETED'
    | 'TASK_CANCELLED'
    | 'COMMENT_ADDED'
    | 'FILE_UPLOADED'
    | 'PROOF_UPLOADED'
    | 'DEADLINE_CHANGED'
    | 'PRIORITY_CHANGED'
    | 'STATUS_CHANGED';
  message: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface TaskFilterParams {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  assignedBy?: string;
  department?: string;
  deadline?: 'today' | 'this_week' | 'overdue' | 'all' | string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo?: string;
  assignees?: string[];
  assigneeIds?: string[];
  targetType?: AssignmentTargetType;
  priority: TaskPriority;
  deadline: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assignedTo?: string;
  assignees?: string[];
  assigneeIds?: string[];
  targetType?: AssignmentTargetType;
  priority?: TaskPriority;
  status?: TaskStatus;
  deadline?: string;
}

export interface CompleteTaskPayload {
  completionComment?: string;
  proofOfWork?: {
    filename: string;
    fileType: string;
    size: number;
    url: string;
    comment?: string;
  };
}
