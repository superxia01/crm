// Dashboard Service
// Handles dashboard-related API calls

import { apiClient } from '../apiClient';

export interface StageStats {
  stage: string;
  count: number;
  total_value: string;
}

export interface DashboardStats {
  total_customers: number;
  total_follow_ups: number;
  stage_distribution: StageStats[];
  upcoming_follow_ups: number;
  high_intent_customers: number;
  this_month_new: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
  value: string;
}

class DashboardService {
  // Get dashboard statistics
  async getStats(): Promise<DashboardStats> {
    try {
      const response = await apiClient.get<DashboardStats>('/dashboard/stats');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch dashboard stats');
    } catch (error) {
      throw error;
    }
  }

  // Get sales funnel data
  async getSalesFunnel(): Promise<FunnelData[]> {
    try {
      const response = await apiClient.get<FunnelData[]>('/dashboard/funnel');

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch sales funnel');
    } catch (error) {
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
