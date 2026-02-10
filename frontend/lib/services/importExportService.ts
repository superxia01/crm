// Import/Export Service
// Handles bulk import and export of customers

import { apiClient } from '../apiClient';

export interface ImportError {
  row: number;
  name: string;
  error: string;
}

export interface ImportResult {
  total: number;
  imported: number;
  failed: number;
  errors?: ImportError[];
}

class ImportExportService {
  // Import customers from Excel or CSV
  async importCustomers(file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await apiClient.post<ImportResult>('/customers/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error(response.error || '导入失败');
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  // Export customers to Excel or CSV
  async exportCustomers(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
    try {
      const response = await fetch(`${apiClient['apiUrl']}/customers/export?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `customers_export.${format}`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['']).*?)(;|$)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  // Download import template
  async downloadTemplate(format: 'xlsx' | 'csv' = 'xlsx'): Promise<void> {
    try {
      const response = await fetch(`${apiClient['apiUrl']}/customers/template?format=${format}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiClient.getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('下载模板失败');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `customers_import_template.${format}`;

      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?)(;|$)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Template download failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const importExportService = new ImportExportService();
