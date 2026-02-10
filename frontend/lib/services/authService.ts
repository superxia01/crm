// Authentication Service
// Handles user registration, login, and session management

import { apiClient, AuthResponse, User } from '../apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
}

class AuthService {
  // Note: register() and login() methods are removed because backend routes are disabled
  // Authentication is now handled via auth-center WeChat login only
  // The token is set in the callback page after WeChat authentication

  // Logout user
  logout(): void {
    apiClient.clearToken();
  }

  // Get current user
  getCurrentUser(): User | null {
    return apiClient.getUser();
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  }

  // Get token
  getToken(): string | null {
    return apiClient.getToken();
  }

  // Fetch current user from server
  async fetchCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/auth/me');

      if (response.success && response.data) {
        apiClient.saveUser(response.data);
        return response.data;
      }

      throw new Error('Failed to fetch user');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
