// API Client for nextCRM Backend
// Handles all HTTP requests with JWT authentication

// Use relative path by default to auto-adapt to current domain
// Can be overridden with VITE_API_URL environment variable for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Storage keys
const TOKEN_KEY = 'nextcrm_token';
const USER_KEY = 'nextcrm_user';

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface User {
  id: string;
  userId: string;
  email: string;
  phoneNumber: string;
  nickname: string;
  avatarUrl: string;
  createdAt: string;
  lastLoginAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// API Client Class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Token Management
  loadToken(): void {
    this.token = localStorage.getItem(TOKEN_KEY);
  }

  saveToken(token: string): void {
    this.token = token;
    localStorage.setItem(TOKEN_KEY, token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getToken(): string | null {
    return this.token;
  }

  saveUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  getUser(): User | null {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // HTTP Methods
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Check if body is FormData - don't set Content-Type for FormData
    // as the browser will set it with the correct boundary
    const isFormData = options.body instanceof FormData;

    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Always load latest token from localStorage before each request
    this.loadToken();

    // Add authorization header if token exists
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const text = await response.text();
      let data: ApiResponse<T>;
      if (!text.trim()) {
        if (!response.ok) {
          throw new Error(response.status === 500 ? '服务器错误，请稍后重试' : `Request failed (${response.status})`);
        }
        data = {} as ApiResponse<T>;
      } else {
        try {
          data = JSON.parse(text) as ApiResponse<T>;
        } catch {
          if (!response.ok) {
            throw new Error(response.status === 500 ? '服务器错误，请稍后重试' : `Request failed (${response.status})`);
          }
          throw new Error('Invalid response from server');
        }
      }

      if (!response.ok) {
        throw new Error((data && typeof data === 'object' && data.error) ? data.error : `Request failed (${response.status})`);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred');
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    // Check if data is FormData - don't stringify it
    const isFormData = data instanceof FormData;

    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_BASE_URL);

// Helper function to handle API errors
export function handleApiError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}
