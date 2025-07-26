export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface ExtractionApiRequest {
  file_data: string
  file_name: string
  file_type: string
  openai_api_key?: string
  user_id?: string
  enhance_text?: boolean
}

export interface ExtractionApiResponse {
  extracted_text: string
  confidence_score: number
  processing_time: number
  file_name: string
  extraction_id?: string
}

export class TextExtractAPI {
  private baseUrl: string
  private authToken?: string

  constructor(baseUrl?: string, authToken?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_BASE_URL || 'https://supabase.n8n-tech.cloud/functions/v1'
    this.authToken = authToken
  }

  setAuthToken(token: string) {
    this.authToken = token
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}/${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      })

      const data = await response.json()
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP ${response.status}: ${response.statusText}`
        }
      }

      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      }
    }
  }

  /**
   * Extract text from a file
   */
  async extractText(request: ExtractionApiRequest): Promise<ApiResponse<ExtractionApiResponse>> {
    return this.makeRequest<ExtractionApiResponse>('extract-text', {
      method: 'POST',
      body: JSON.stringify(request)
    })
  }

  /**
   * Get user extractions with pagination and filtering
   */
  async getExtractions(params: {
    user_id: string
    limit?: number
    offset?: number
    search?: string
    file_type?: string
  }): Promise<ApiResponse<{
    extractions: any[]
    total: number
    page: number
    limit: number
  }>> {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString())
      }
    })

    return this.makeRequest(`get-extractions?${searchParams.toString()}`, {
      method: 'GET'
    })
  }

  /**
   * Get user analytics
   */
  async getAnalytics(params: {
    user_id: string
    date_range?: {
      start: string
      end: string
    }
  }): Promise<ApiResponse<{
    user_analytics: any
    daily_extractions: any[]
    file_type_distribution: any[]
    confidence_distribution: any[]
  }>> {
    return this.makeRequest('get-analytics', {
      method: 'POST',
      body: JSON.stringify(params)
    })
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.makeRequest('health', {
      method: 'GET'
    })
  }
}

// Export a default instance
export const textExtractAPI = new TextExtractAPI()

// Helper function to convert file to base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const base64 = reader.result as string
      resolve(base64.split(',')[1]) // Remove data:image/jpeg;base64, prefix
    }
    reader.onerror = error => reject(error)
  })
}

// Example usage:
/*
import { textExtractAPI, fileToBase64 } from './lib/api'

// Set authentication token
textExtractAPI.setAuthToken('your-jwt-token')

// Extract text from file
const file = document.querySelector('input[type="file"]').files[0]
const fileBase64 = await fileToBase64(file)

const result = await textExtractAPI.extractText({
  file_data: fileBase64,
  file_name: file.name,
  file_type: file.type,
  openai_api_key: 'sk-your-key',
  user_id: 'user-123',
  enhance_text: true
})

if (result.success) {
  console.log('Extracted:', result.data.extracted_text)
} else {
  console.error('Error:', result.error)
}
*/