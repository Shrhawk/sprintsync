// API client for Sprint Sync application

import type {
  User,
  Task,
  CreateTaskData,
  UpdateTaskData,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  AISuggestion,
  DailyPlan,
  TaskStatus
} from '../types';

// Base API configuration
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE) {
    this.baseURL = baseURL;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If we can't parse the error response, use the default message
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = 'Invalid email or password';
      
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // Use default error message
      }
      
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  async register(data: RegisterData): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  async updateProfile(data: { full_name: string; email: string }): Promise<User> {
    return this.request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Task endpoints
  async getTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks');
  }

  async getTask(id: string): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`);
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    // Transform data for backend compatibility
    const transformedData = {
      title: data.title,
      description: data.description || null,
      assigned_to: data.assigned_to && data.assigned_to.trim() !== '' ? data.assigned_to : null,
    };

    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(transformedData),
    });
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    return this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async addTimeToTask(id: string, minutes: number): Promise<Task> {
    return this.request<Task>(`/tasks/${id}/time`, {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  }

  async deleteTask(id: string): Promise<void> {
    return this.request<void>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints for all tasks
  async getAllTasks(): Promise<Task[]> {
    return this.request<Task[]>('/admin/tasks');
  }

  // User management endpoints
  async getAllUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async createUser(data: RegisterData): Promise<User> {
    return this.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(userId: string, data: Partial<RegisterData>): Promise<User> {
    return this.request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request<void>(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // AI endpoints
  async suggestTaskDescription(title: string, context?: string): Promise<AISuggestion> {
    return this.request<AISuggestion>('/ai/suggest-description', {
      method: 'POST',
      body: JSON.stringify({ title, context }),
    });
  }

  async getDailyPlan(): Promise<DailyPlan> {
    return this.request<DailyPlan>('/ai/daily-plan');
  }
}

// Create and export a singleton instance
const apiClient = new ApiClient();

export { apiClient };
export default apiClient;