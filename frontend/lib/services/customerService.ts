// Customer Service
// Handles all customer-related API calls

import { apiClient, ApiResponse, PaginatedResponse } from '../apiClient';

// Types matching the backend DTOs
export interface Customer {
  id: number;
  user_id: number;
  name: string;
  company: string;
  position?: string;
  phone: string;
  email?: string;
  industry?: string;
  budget?: string;
  intent_level: string;
  stage: string;
  source: string;
  follow_up_count: number;
  contract_value?: string;
  contract_status: string;
  contract_start_date?: string;
  contract_end_date?: string;
  expected_close_date?: string;
  probability: number;
  annual_revenue?: string;
  notes?: string;
  last_contact?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  name: string;
  company: string;
  position?: string;
  phone: string;
  email?: string;
  industry?: string;
  budget?: string;
  intent_level?: string;
  stage?: string;
  source?: string;
  contract_value?: string;
  contract_status?: string;
  expected_close_date?: string;
  probability?: number;
  annual_revenue?: string;
  notes?: string;
}

export interface UpdateCustomerRequest {
  name?: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  industry?: string;
  budget?: string;
  intent_level?: string;
  stage?: string;
  source?: string;
  follow_up_count?: number;
  contract_value?: string;
  contract_status?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  expected_close_date?: string;
  probability?: number;
  annual_revenue?: string;
  notes?: string;
  last_contact?: string;
}

export interface CustomerListParams {
  page?: number;
  per_page?: number;
  search?: string;
  stage?: string;
  intent_level?: string;
  source?: string;
  industry?: string;
  sort_by?: string;
  sort_order?: string;
}

class CustomerService {
  // List customers with pagination and filters
  async listCustomers(params: CustomerListParams = {}): Promise<{
    customers: Customer[];
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
      if (params.stage) queryParams.append('stage', params.stage);
      if (params.intent_level) queryParams.append('intent_level', params.intent_level);
      if (params.source) queryParams.append('source', params.source);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<Customer[]>(endpoint);

      if (response.success) {
        return {
          customers: response.data || [],
          meta: (response as any).meta || {
            page: params.page || 1,
            per_page: params.per_page || 10,
            total: 0,
            total_pages: 0,
          },
        };
      }

      throw new Error('Failed to fetch customers');
    } catch (error) {
      throw error;
    }
  }

  // Get a single customer by ID
  async getCustomer(id: number): Promise<Customer> {
    try {
      const response = await apiClient.get<Customer>(`/customers/${id}`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to fetch customer');
    } catch (error) {
      throw error;
    }
  }

  // Create a new customer
  async createCustomer(data: CreateCustomerRequest): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>('/customers', data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to create customer');
    } catch (error) {
      throw error;
    }
  }

  // Update a customer
  async updateCustomer(id: number, data: UpdateCustomerRequest): Promise<Customer> {
    try {
      const response = await apiClient.put<Customer>(`/customers/${id}`, data);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to update customer');
    } catch (error) {
      throw error;
    }
  }

  // Delete a customer
  async deleteCustomer(id: number): Promise<void> {
    try {
      const response = await apiClient.delete<void>(`/customers/${id}`);

      if (!response.success) {
        throw new Error('Failed to delete customer');
      }
    } catch (error) {
      throw error;
    }
  }

  // Increment follow-up count
  async incrementFollowUp(id: number): Promise<void> {
    try {
      const response = await apiClient.post<void>(`/customers/${id}/follow-up`);

      if (!response.success) {
        throw new Error('Failed to increment follow-up count');
      }
    } catch (error) {
      throw error;
    }
  }

  // Archive a customer
  async archiveCustomer(id: number): Promise<void> {
    try {
      const response = await apiClient.post<void>(`/customers/${id}/archive`);

      if (!response.success) {
        throw new Error('Failed to archive customer');
      }
    } catch (error) {
      throw error;
    }
  }

  // Restore an archived customer
  async restoreCustomer(id: number): Promise<Customer> {
    try {
      const response = await apiClient.post<Customer>(`/customers/${id}/restore`);

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to restore customer');
    } catch (error) {
      throw error;
    }
  }

  // List archived customers
  async listArchivedCustomers(params: CustomerListParams = {}): Promise<{
    customers: Customer[];
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
      if (params.stage) queryParams.append('stage', params.stage);
      if (params.intent_level) queryParams.append('intent_level', params.intent_level);
      if (params.source) queryParams.append('source', params.source);
      if (params.industry) queryParams.append('industry', params.industry);
      if (params.sort_by) queryParams.append('sort_by', params.sort_by);
      if (params.sort_order) queryParams.append('sort_order', params.sort_order);

      const queryString = queryParams.toString();
      const endpoint = `/customers/archived${queryString ? `?${queryString}` : ''}`;

      const response = await apiClient.get<Customer[]>(endpoint);

      if (response.success) {
        return {
          customers: response.data || [],
          meta: (response as any).meta || {
            page: params.page || 1,
            per_page: params.per_page || 10,
            total: 0,
            total_pages: 0,
          },
        };
      }

      throw new Error('Failed to fetch archived customers');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const customerService = new CustomerService();
