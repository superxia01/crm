// AI Service
// Handles all AI-related API calls (script generation, customer analysis, speech-to-text, OCR)

import { apiClient, ApiResponse } from '../apiClient';

// Types matching the backend DTOs
export interface GenerateScriptRequest {
  context: string;
  customer_name: string;
  industry?: string;
  pain_points?: string;
  scenario?: string;
}

export interface GenerateScriptResponse {
  script: string;
  key_points: string[];
  tips: string[];
}

export interface AnalyzeCustomerRequest {
  customer_id: number;
  analysis_type?: string;
}

export interface AnalyzeCustomerResponse {
  customer_id: number;
  analysis_type: string;
  summary: string;
  intent_score: number;
  risk_level: string;
  opportunities: string[];
  recommendations: string[];
  next_actions: string[];
}

export interface GenerateEmbeddingRequest {
  text: string;
}

export interface GenerateEmbeddingResponse {
  embedding: number[];
  dimension: number;
}

// Speech-to-Text
export interface SpeechToTextRequest {
  audio: FormData;
  language?: string;
}

export interface SpeechToTextResponse {
  text: string;
  confidence: number;
  duration: number;
}

// OCR Business Card
export interface OCRBusinessCardRequest {
  image: FormData;
}

export interface OCRBusinessCardResponse {
  name?: string;
  company?: string;
  position?: string;
  phone?: string;
  email?: string;
  address?: string;
  confidence?: number;
}

class AIService {
  // Generate sales script
  async generateScript(data: GenerateScriptRequest): Promise<GenerateScriptResponse> {
    try {
      const response = await apiClient.post<GenerateScriptResponse>(
        '/ai/scripts/generate',
        data
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to generate script');
    } catch (error) {
      throw error;
    }
  }

  // Analyze customer
  async analyzeCustomer(
    customerId: number,
    analysisType: string = 'comprehensive'
  ): Promise<AnalyzeCustomerResponse> {
    try {
      const response = await apiClient.post<AnalyzeCustomerResponse>(
        `/ai/customers/${customerId}/analyze`,
        { analysis_type: analysisType }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to analyze customer');
    } catch (error) {
      throw error;
    }
  }

  // Generate embedding
  async generateEmbedding(text: string): Promise<GenerateEmbeddingResponse> {
    try {
      const response = await apiClient.post<GenerateEmbeddingResponse>(
        '/ai/knowledge/embed',
        { text }
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to generate embedding');
    } catch (error) {
      throw error;
    }
  }

  // Speech-to-Text (语音识别)
  async speechToText(formData: FormData): Promise<SpeechToTextResponse> {
    try {
      const response = await apiClient.post<SpeechToTextResponse>(
        '/ai/speech-to-text',
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to recognize speech');
    } catch (error) {
      throw error;
    }
  }

  // OCR Business Card (名片识别)
  async ocrBusinessCard(formData: FormData): Promise<OCRBusinessCardResponse> {
    try {
      const response = await apiClient.post<OCRBusinessCardResponse>(
        '/ai/ocr-card',
        formData
      );

      if (response.success && response.data) {
        return response.data;
      }

      throw new Error('Failed to recognize business card');
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const aiService = new AIService();
