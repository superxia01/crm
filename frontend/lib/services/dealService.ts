// Deal Service - 业绩管理 API

import { apiClient } from '../apiClient';

export interface Deal {
  id: number;
  record_no: string;
  user_id: number;
  customer_id: number;
  deal_type: string;
  product_or_service: string;
  quantity: number;
  unit: string;
  amount: number;
  currency: string;
  contract_no?: string;
  signed_at?: string;
  payment_status: string;
  paid_amount: number;
  paid_at?: string;
  is_repeat_purchase: boolean;
  deal_at: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  customer_name?: string;
}

export interface CreateDealRequest {
  customer_id: number;
  deal_type?: string;
  product_or_service: string;
  quantity?: number;
  unit?: string;
  amount: number;
  currency?: string;
  contract_no?: string;
  signed_at?: string;
  payment_status?: string;
  paid_amount?: number;
  paid_at?: string;
  is_repeat_purchase?: boolean;
  deal_at: string;
  notes?: string;
}

export interface UpdateDealRequest {
  deal_type?: string;
  product_or_service?: string;
  quantity?: number;
  unit?: string;
  amount?: number;
  currency?: string;
  contract_no?: string;
  signed_at?: string;
  payment_status?: string;
  paid_amount?: number;
  paid_at?: string;
  is_repeat_purchase?: boolean;
  deal_at?: string;
  notes?: string;
}

export interface DealListParams {
  page?: number;
  per_page?: number;
  customer_id?: number;
  deal_type?: string;
  sort_by?: string;
  sort_order?: string;
}

export interface CustomerDealsSummary {
  deals: Deal[];
  total_amount: number;
  repeat_count: number;
}

class DealService {
  async listDeals(params: DealListParams = {}): Promise<{
    deals: Deal[];
    meta: { page: number; per_page: number; total: number; total_pages: number };
  }> {
    const queryParams = new URLSearchParams();
    if (params.page != null) queryParams.append('page', params.page.toString());
    if (params.per_page != null) queryParams.append('per_page', params.per_page.toString());
    if (params.customer_id != null) queryParams.append('customer_id', params.customer_id.toString());
    if (params.deal_type) queryParams.append('deal_type', params.deal_type);
    if (params.sort_by) queryParams.append('sort_by', params.sort_by);
    if (params.sort_order) queryParams.append('sort_order', params.sort_order);

    const qs = queryParams.toString();
    const response = await apiClient.get<Deal[]>(`/deals${qs ? `?${qs}` : ''}`);

    if (!response.success) throw new Error('Failed to fetch deals');

    const meta = (response as any).meta ?? {
      page: params.page ?? 1,
      per_page: params.per_page ?? 20,
      total: 0,
      total_pages: 0,
    };
    return {
      deals: Array.isArray(response.data) ? response.data : [],
      meta,
    };
  }

  async getDeal(id: number): Promise<Deal> {
    const response = await apiClient.get<Deal>(`/deals/${id}`);
    if (!response.success || !response.data) throw new Error('Failed to fetch deal');
    return response.data;
  }

  async createDeal(data: CreateDealRequest): Promise<Deal> {
    const response = await apiClient.post<Deal>('/deals', data);
    if (!response.success || !response.data) throw new Error('Failed to create deal');
    return response.data;
  }

  async updateDeal(id: number, data: UpdateDealRequest): Promise<Deal> {
    const response = await apiClient.put<Deal>(`/deals/${id}`, data);
    if (!response.success || !response.data) throw new Error('Failed to update deal');
    return response.data;
  }

  async deleteDeal(id: number): Promise<void> {
    const response = await apiClient.delete(`/deals/${id}`);
    if (!response.success) throw new Error('Failed to delete deal');
  }

  async listDealsByCustomerId(customerId: number): Promise<CustomerDealsSummary> {
    const response = await apiClient.get<CustomerDealsSummary>(`/customers/${customerId}/deals`);
    if (!response.success || !response.data) throw new Error('Failed to fetch customer deals');
    return response.data;
  }
}

export const dealService = new DealService();
