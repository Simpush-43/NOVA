import { api } from './client';
import type { ActivityItem, Member, Project } from '../types';

export async function listProjects(): Promise<Project[]> {
  const res = await api.get<{ projects: Project[] }>('/projects');
  return res.projects;
}

export async function createProject(name: string, description: string): Promise<Project> {
  const res = await api.post<{ project: Project }>('/projects', { name, description });
  return res.project;
}

export async function getProject(id: string): Promise<Project> {
  const res = await api.get<{ project: Project }>(`/projects/${id}`);
  return res.project;
}

export async function updateProject(
  id: string,
  updates: Partial<{ name: string; description: string; archived: boolean }>
): Promise<Project> {
  const res = await api.patch<{ project: Project }>(`/projects/${id}`, updates);
  return res.project;
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}

export async function inviteMember(projectId: string, email: string, role: 'admin' | 'member' = 'member'): Promise<Member> {
  const res = await api.post<{ member: Member }>(`/projects/${projectId}/members`, { email, role });
  return res.member;
}

export async function removeMember(projectId: string, userId: string): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

export async function getActivity(projectId: string): Promise<ActivityItem[]> {
  const res = await api.get<{ activity: ActivityItem[] }>(`/projects/${projectId}/activity`);
  return res.activity;
}
