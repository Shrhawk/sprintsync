export interface User {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export type Priority = 'high' | 'medium' | 'low';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  total_minutes: number;
  user_id: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at: string;
}

export const TaskStatus = {
  TODO: "TODO",
  IN_PROGRESS: "IN_PROGRESS", 
  DONE: "DONE"
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export interface CreateTaskData {
  title: string;
  description?: string;
  assigned_to?: string;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  total_minutes?: number;
  assigned_to?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AISuggestion {
  suggestion: string;
  success: boolean;
  fallback: boolean;
}

export interface DailyPlanTask {
  title: string;
  estimated_minutes: number;
  priority: "high" | "medium" | "low";
  description?: string;
}

export interface DailyPlan {
  tasks: DailyPlanTask[];
  total_estimated_minutes: number;
  plan_summary: string;
  success: boolean;
  fallback: boolean;
}

export interface UserStats {
  total_tasks: number;
  todo_tasks: number;
  in_progress_tasks: number;
  completed_tasks: number;
  total_minutes_logged: number;
  average_minutes_per_task: number;
  completion_rate: number; // percentage
}
