import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TransactionApiService } from '../../services';
import {
  TransactionRequest,
  TransactionResponse,
  TransactionUpdateRequest,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '../../models/api-models';
import { FetchHttpClientService } from './fetch-http-client.service';
import { ApiResponse } from '../../interfaces/http-client.interface';

/**
 * Fetch API implementation of TransactionApiService
 */
@Injectable()
export class FetchTransactionApiService extends TransactionApiService {
  private readonly endpoint = '/api/transactions';

  constructor(private http: FetchHttpClientService) {
    super();
  }

  getAll(): Observable<TransactionResponse[]> {
    return this.http
      .get<ApiResponse<TransactionResponse[]>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  getById(id: string): Observable<TransactionResponse> {
    return this.http
      .get<ApiResponse<TransactionResponse>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getByStatus(
    status: 'IN' | 'OUT' | 'PENDING'
  ): Observable<TransactionResponse[]> {
    return this.http
      .get<ApiResponse<TransactionResponse[]>>(
        `${this.endpoint}/status/${status}`
      )
      .pipe(map((response) => response.data));
  }

  getUnsynced(): Observable<TransactionResponse[]> {
    return this.http
      .get<ApiResponse<TransactionResponse[]>>(`${this.endpoint}/sync/pending`)
      .pipe(map((response) => response.data));
  }

  create(transaction: TransactionRequest): Observable<CreateResponse> {
    return this.http.post<CreateResponse>(this.endpoint, transaction);
  }

  update(
    id: string,
    updates: TransactionUpdateRequest
  ): Observable<UpdateResponse> {
    return this.http.patch<UpdateResponse>(`${this.endpoint}/${id}`, updates);
  }

  delete(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.endpoint}/${id}`);
  }
}
