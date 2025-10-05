import { Injectable } from '@angular/core';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  IHttpClient,
  RequestOptions,
} from '../../interfaces/http-client.interface';

/**
 * Fetch API implementation of IHttpClient
 * Uses browser's native Fetch API
 */
@Injectable()
export class FetchHttpClientService implements IHttpClient {
  private baseUrl = 'http://localhost:3000'; // Can be configured via environment

  get<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  post<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('POST', url, body, options);
  }

  put<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('PUT', url, body, options);
  }

  patch<T>(url: string, body: any, options?: RequestOptions): Observable<T> {
    return this.request<T>('PATCH', url, body, options);
  }

  delete<T>(url: string, options?: RequestOptions): Observable<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private request<T>(
    method: string,
    url: string,
    body?: any,
    options?: RequestOptions
  ): Observable<T> {
    const fullUrl = this.buildUrl(url, options?.params);
    const headers = this.buildHeaders(options?.headers);

    const fetchOptions: RequestInit = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    };

    return from(
      fetch(fullUrl, fetchOptions).then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
    ).pipe(
      map((data) => data as T),
      catchError((error) => {
        console.error('HTTP Error:', error);
        return throwError(() => error);
      })
    );
  }

  private buildUrl(url: string, params?: Record<string, string>): string {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;

    if (!params) return fullUrl;

    const searchParams = new URLSearchParams(params);
    return `${fullUrl}?${searchParams.toString()}`;
  }

  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    return headers;
  }
}
