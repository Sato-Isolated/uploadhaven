/**
 * Unified API Client for UploadHaven
 * Combines the best features from both previous implementations
 * Optimized for TanStack Query with proper error handling
 */

export class ApiClient {
  // Enhanced base URL handling with fallbacks (from query client)
  private static baseURL = process.env.NEXT_PUBLIC_API_URL || 
    process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

  /**
   * Enhanced generic request method with unified error handling
   * Supports both relative and absolute URLs like the query client
   */
  static async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // Smart URL construction - handle both relative and absolute URLs
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Add cache control optimization for TanStack Query
      cache: options?.cache || 'no-store',
      ...options,
    });

    if (!response.ok) {
      // Enhanced error handling - try to parse error details
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 
        errorData.message || 
        `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * GET request helper
   */
  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }
  /**
   * POST request helper
   */
  static post<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request helper
   */
  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
  /**
   * PUT request helper
   */
  static put<T>(endpoint: string, data?: Record<string, unknown>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  /**
   * File upload helper (FormData) - Enhanced version
   * Now uses the unified request method for consistency
   */
  static async uploadFile<T>(endpoint: string, formData: FormData): Promise<T> {
    // Smart URL construction
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      // Note: Don't set Content-Type for FormData - browser handles it
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 
        errorData.message || 
        `Upload failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  }

  /**
   * Utility method to check if client is properly configured
   */
  static getBaseURL(): string {
    return this.baseURL;
  }
  /**
   * Utility method to create FormData from object
   * Helpful for file uploads with metadata
   */
  static createFormData(data: Record<string, unknown>): FormData {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value as string | Blob);
      }
    });
    return formData;
  }
}
