// Interaction Service
// Handles customer interaction/follow-up records

import { apiClient, ApiResponse } from '../apiClient';

export interface Interaction {
  id: number;
  customer_id: number;
  customer?: {
    id: number;
    name: string;
    company: string;
  };
  type: string; // call, email, meeting, note
  content: string;
  outcome?: string; // positive, neutral, negative
  next_action?: string;
  next_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInteractionRequest {
  customer_id: number;
  type: string;
  content: string;
  outcome?: string;
  next_action?: string;
  next_date?: string;
}

export interface UpdateInteractionRequest {
  type?: string;
  content?: string;
  outcome?: string;
  next_action?: string;
  next_date?: string;
}

class InteractionService {
  // Get all interactions for a customer
  async getByCustomerId(customerId: number): Promise<Interaction[]> {
    if (customerId == null || customerId <= 0 || Number.isNaN(customerId)) {
      throw new Error('Invalid customer ID');
    }
    try {
      const response = await apiClient.get<Interaction[]>(`/customers/${customerId}/interactions`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch interactions:', error);
      throw error;
    }
  }

  // Get a specific interaction
  async getById(id: number): Promise<Interaction> {
    try {
      const response = await apiClient.get<Interaction>(`/interactions/${id}`);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to fetch interaction');
    } catch (error) {
      console.error('Failed to fetch interaction:', error);
      throw error;
    }
  }

  // Create a new interaction
  async create(data: CreateInteractionRequest): Promise<Interaction> {
    const cid = data.customer_id;
    if (cid == null || cid <= 0 || Number.isNaN(cid)) {
      throw new Error('Invalid customer ID');
    }
    try {
      const response = await apiClient.post<Interaction>(`/customers/${cid}/interactions`, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to create interaction');
    } catch (error) {
      console.error('Failed to create interaction:', error);
      throw error;
    }
  }

  // Update an interaction
  async update(id: number, data: UpdateInteractionRequest): Promise<Interaction> {
    try {
      const response = await apiClient.put<Interaction>(`/interactions/${id}`, data);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error('Failed to update interaction');
    } catch (error) {
      console.error('Failed to update interaction:', error);
      throw error;
    }
  }

  // Delete an interaction
  async delete(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`/interactions/${id}`);
      if (!response.success) {
        throw new Error('Failed to delete interaction');
      }
    } catch (error) {
      console.error('Failed to delete interaction:', error);
      throw error;
    }
  }

  // Get upcoming interactions
  async getUpcoming(fromDate?: string): Promise<Interaction[]> {
    try {
      const params = fromDate ? `?from_date=${fromDate}` : '';
      const response = await apiClient.get<Interaction[]>(`/interactions/upcoming${params}`);
      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch upcoming interactions:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const interactionService = new InteractionService();
