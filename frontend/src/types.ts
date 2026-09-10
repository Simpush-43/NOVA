export type Role = 'owner' | 'admin' | 'member';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
  color: string;
}

export interface Member extends User {
  role: Role;
}

export interface ProjectStats {
  todo: number;
  in_progress: number;
  in_review: number;
  done: number;
  total: number;
  percentComplete: number;
}

export interface MemberPreview {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  color: string;
  owner_id: string;
  created_at: string;
  archived: 0 | 1;
  member_count?: number;
  member_preview?: MemberPreview[];
  stats: ProjectStats;
  members?: Member[];
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  assignee_name: string | null;
  assignee_color: string | null;
  due_date: string | null;
  created_by: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  body: string;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_color: string;
  action: string;
  detail: string;
  created_at: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  in_review: 'In review',
  done: 'Done',
};

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'in_review', 'done'];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};
