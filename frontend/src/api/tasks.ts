import { api } from './client';
import type { Comment, Task, TaskPriority, TaskStatus } from '../types';

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string | null;
  dueDate?: string | null;
}

export async function listTasks(projectId: string): Promise<Task[]> {
  const res = await api.get<{ tasks: Task[] }>(`/projects/${projectId}/tasks`);
  return res.tasks;
}

export async function createTask(projectId: string, input: TaskInput): Promise<Task> {
  const res = await api.post<{ task: Task }>(`/projects/${projectId}/tasks`, input);
  return res.task;
}

export async function updateTask(taskId: string, updates: Partial<TaskInput & { position: number }>): Promise<Task> {
  const res = await api.patch<{ task: Task }>(`/tasks/${taskId}`, updates);
  return res.task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function listComments(taskId: string): Promise<Comment[]> {
  const res = await api.get<{ comments: Comment[] }>(`/tasks/${taskId}/comments`);
  return res.comments;
}

export async function addComment(taskId: string, body: string): Promise<Comment> {
  const res = await api.post<{ comment: Comment }>(`/tasks/${taskId}/comments`, { body });
  return res.comment;
}
