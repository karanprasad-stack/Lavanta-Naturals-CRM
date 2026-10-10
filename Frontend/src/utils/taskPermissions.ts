import { Task } from '../types/task';
import { User } from '../types';

export interface TaskPermissions {
  /** Can the user view this task? */
  canView: boolean;
  /** Can the user create / assign tasks? */
  canCreate: boolean;
  /** Can the user edit metadata (title, description, priority, deadline, reassign)? */
  canEdit: boolean;
  /** Can the user change task status (To Do, In Progress, Completed, Cancelled)? */
  canChangeStatus: boolean;
  /** Can the user delete or cancel this task? */
  canDelete: boolean;
  /** Can the user trigger the Start Task action? (Assignee or Management when TODO) */
  canStart: boolean;
  /** Can the user trigger the Complete Task action? (Assignee or Management when IN_PROGRESS) */
  canComplete: boolean;
  /** Does the authenticated user have management standing (Founder, HR, Manager)? */
  isManagement: boolean;
  /** Is the authenticated user the actual assignee of this specific task? */
  isAssignee: boolean;
}

/**
 * Determines task permissions strictly evaluated against the CURRENT AUTHENTICATED USER's role,
 * NOT the task assignee's role.
 *
 * Example:
 * Logged-in Founder viewing a task assigned to Employee Rahul -> evaluates to Founder permissions!
 */
export function getTaskPermissions(
  currentUser: User | null | undefined,
  task?: Task | null
): TaskPermissions {
  if (!currentUser) {
    return {
      canView: false,
      canCreate: false,
      canEdit: false,
      canChangeStatus: false,
      canDelete: false,
      canStart: false,
      canComplete: false,
      isManagement: false,
      isAssignee: false
    };
  }

  const role = (currentUser.role || 'EMPLOYEE').toUpperCase();
  const currentUserId = currentUser.id || (currentUser as any)?._id;

  const isFounder = role === 'FOUNDER';
  const isHR = role === 'HR' || role === 'HR_MANAGER';
  const isManager = role === 'MANAGER';
  const isManagement = isFounder || isHR || isManager;

  const assigneeId = task?.assignedTo?._id || (task?.assignedTo as any)?.id;
  const isAssignee = Boolean(
    currentUserId &&
      ((task?.assignees &&
        task.assignees.some(a => {
          const aId = a?._id || (a as any)?.id || a;
          return aId && aId.toString() === currentUserId.toString();
        })) ||
        (assigneeId && assigneeId.toString() === currentUserId.toString()))
  );

  // Management scope:
  // Founder: full company-wide authority
  // HR: full company-wide authority
  // Manager: tasks within their department, tasks they assigned, or tasks assigned to them
  const isManagerInScope =
    isManager &&
    (!task ||
      task.department === currentUser.department ||
      task.assignedBy?._id === currentUserId ||
      isAssignee);

  const hasManagementAuthority = isFounder || isHR || isManagerInScope;

  return {
    canView: hasManagementAuthority || isAssignee,
    canCreate: isManagement,
    canEdit: hasManagementAuthority,
    canChangeStatus: hasManagementAuthority || isAssignee,
    canDelete: hasManagementAuthority,
    canStart: Boolean((isAssignee || hasManagementAuthority) && task?.status === 'TODO'),
    canComplete: Boolean((isAssignee || hasManagementAuthority) && task?.status === 'IN_PROGRESS'),
    isManagement,
    isAssignee
  };
}
