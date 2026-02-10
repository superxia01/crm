// Knowledge Service
// Handles all knowledge base related API calls

import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';

// Types matching the backend DTOs
export interface Knowledge {
  id: number;
  user_id: number;
  title: string;
  content: string;
  type: string;
  tags: string[];
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateKnowledgeRequest {
  title: string;
  content: string;
  type: string;
  tags?: string[];
  description?: string;
}

export interface UpdateKnowledgeRequest {
  title?: string;
  content?: string;
  type?: string;
  tags?: string[];
  description?: string;
}

export interface KnowledgeListParams {
  page?: number;
  per_page?: number;
  search?: string;
  type?: string;
  tags?: string[];
}

export interface KnowledgeSearchRequest {
  query: string;
  type?: string;
  tags?: string[];
  limit?: number;
}

export interface KnowledgeSearchResult {
  id: number;
  title: string;
  content: string;
  type: string;
  tags: string[];
  similarity: number;
}

class KnowledgeService {
  // List knowledge base entries
  async listKnowledge(params: KnowledgeListParams = {}): Promise<{
    knowledges: Knowledge[];
    meta: {
      page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  }> {
    try {
      const queryParams = new URLSearchParams();

      if (params.page) queryParams.append('page', params.page.toString());
      if (params.per_page) queryParams.append('per_page', params.per_page.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.type) queryParams.append('type', params.type);
      if (params.tags && params.tags.length > 0) {
        params.tags.forEach((tag) => queryParams.append('tags', tag));
      }

      const queryString = queryParams.toString();
      const endpoint = `/knowledge${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<Knowledge[]>(endpoint);

      if (response.success) {
        return {
          knowledges: response.data || [],
          meta: (response as any).meta || {
            page: params.page || 1,
            per_page: params.per_page || 10,
            total: 0,
            total_pages: 0,
          },
        };
      }

      throw new Error('Failed to fetch knowledge base');
    } catch (error) {
      throw error;
    }
  }

  // Get a single knowledge entry by ID
  async getKnowledge(id: number): Promise<Knowledge> {
    try {
      const response = await apiClient.get<Knowledge>(`/knowledge/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch knowledge');
    } catch (error) {
      throw error;
    }
  }

  // Create a new knowledge entry
  async createKnowledge(data: CreateKnowledgeRequest): Promise<Knowledge> {
    try {
      const response = await apiClient.post<Knowledge>('/knowledge', data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to create knowledge');
    } catch (error) {
      throw error;
    }
  }

  // Update a knowledge entry
  async updateKnowledge(id: number, data: UpdateKnowledgeRequest): Promise<Knowledge> {
    try {
      const response = await apiClient.put<Knowledge>(`/knowledge/${id}`, data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update knowledge');
    } catch (error) {
      throw error;
    }
  }

  // Delete a knowledge entry
  async deleteKnowledge(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`/knowledge/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete knowledge');
      }
    } catch (error) {
      throw error;
    }
  }

  // Vector similarity search
  async searchKnowledge(data: KnowledgeSearchRequest): Promise<KnowledgeSearchResult[]> {
    try {
      const response = await apiClient.post<KnowledgeSearchResult[]>(
        '/knowledge/search',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to search knowledge');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const knowledgeService = new KnowledgeService();
