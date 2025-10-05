import { Observable } from 'rxjs';

/**
 * Generic HTTP Client interface
 * Allows switching between different HTTP implementations
 * (Fetch API, Angular HttpClient, Axios, etc.)
 */
export interface IHttpClient {
  /**
   * GET request
   */
  get<T>(url: string, options?: RequestOptions): Observable<T>;

  /**
   * POST request
   */
  post<T>(url: string, body: any, options?: RequestOptions): Observable<T>;

  /**
   * PUT request
   */
  put<T>(url: string, body: any, options?: RequestOptions): Observable<T>;

  /**
   * PATCH request
   */
  patch<T>(url: string, body: any, options?: RequestOptions): Observable<T>;

  /**
   * DELETE request
   */
  delete<T>(url: string, options?: RequestOptions): Observable<T>;
}

/**
 * Request options
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  count?: number;
  message?: string;
  error?: string;
  status?: number;
}
