/**
 * API Client for TanStack Query hooks
 * Provides centralized HTTP client with error handling
 */

class ApiClientClass {
  private static baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (
    typeof window !== 'undefined' 
      ? window.location.origin 
      : 'http://localhost:3000'
  );

  /**
   * Generic GET request method
   */
  static async get<T>(endpoint: string): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Let TanStack Query handle caching
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Generic POST request method
   */
  static async post<T>(endpoint: string, data?: any): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Generic PUT request method
   */
  static async put<T>(endpoint: string, data?: any): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Generic DELETE request method
   */
  static async delete<T>(endpoint: string): Promise<T> {
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }    return response.json();
  }
}

// Export as default and named export
export const ApiClient = ApiClientClass;
export default ApiClient;
