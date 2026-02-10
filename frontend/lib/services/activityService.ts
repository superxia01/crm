// Activity Service
// Handles activity feed, revenue history, and pipeline risks API calls

import { apiClient, ApiResponse } from '../apiClient';

// Types
export interface Activity {
  id: number;
  user: string;
  text: string;
  time: string;
  type: 'user' | 'ai';
  customer_id?: number;
  customer_name?: string;
  metadata?: Record<string, any>;
}

export interface RevenueHistory {
  month: string;
  revenue: number;
  target: number;
}

export interface PipelineRisk {
  id: number;
  deal: string;
  client: string;
  company: string;
  value: string;
  stage: string;
  risk_level: 'High' | 'Medium' | 'Low';
  reason: string;
  ai_advice: string;
  days_idle?: number;
}

export interface ActivitiesListResponse {
  activities: Activity[];
  total: number;
  page: number;
  per_page: number;
}

class ActivityService {
  // Get recent activities for dashboard
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const response = await apiClient.get<Activity[]>('/dashboard/activities');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch activities');
    } catch (error) {
      throw error;
    }
  }

  // Get activities with pagination
  async getActivities(page: number = 1, perPage: number = 20): Promise<ActivitiesListResponse> {
    try {
      const response = await apiClient.get<ActivitiesListResponse>(
        `/activities?page=${page}&per_page=${perPage}`
      );
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch activities');
    } catch (error) {
      throw error;
    }
  }

  // Get revenue history for dashboard
  async getRevenueHistory(): Promise<RevenueHistory[]> {
    try {
      const response = await apiClient.get<RevenueHistory[]>('/dashboard/revenue-history');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch revenue history');
    } catch (error) {
      throw error;
    }
  }

  // Get pipeline risks for dashboard
  async getPipelineRisks(): Promise<PipelineRisk[]> {
    try {
      const response = await apiClient.get<PipelineRisk[]>('/dashboard/pipeline-risks');
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch pipeline risks');
    } catch (error) {
      throw error;
    }
  }

  // Create a new activity log
  async createActivity(data: {
    action_type: string;
    customer_id?: number;
    entity_type?: string;
    entity_id?: number;
    description: string;
    metadata?: Record<string, any>;
    is_ai_generated?: boolean;
    ai_confidence?: number;
  }): Promise<{ id: number }> {
    try {
      const response = await apiClient.post<{ id: number }>('/activities', data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create activity');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const activityService = new ActivityService();
