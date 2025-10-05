import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExceptionLogApiService } from '../../services';
import {
  ExceptionLogRequest,
  ExceptionLogResponse,
  ExceptionLogUpdateRequest,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '../../models/api-models';
import { FetchHttpClientService } from './fetch-http-client.service';
import { ApiResponse } from '../../interfaces/http-client.interface';

/**
 * Fetch API implementation of ExceptionLogApiService
 */
@Injectable()
export class FetchExceptionLogApiService extends ExceptionLogApiService {
  private readonly endpoint = '/api/exception-logs';

  constructor(private http: FetchHttpClientService) {
    super();
  }

  getAll(): Observable<ExceptionLogResponse[]> {
    return this.http
      .get<ApiResponse<ExceptionLogResponse[]>>(this.endpoint)
      .pipe(map((response) => response.data));
  }

  getById(id: string): Observable<ExceptionLogResponse> {
    return this.http
      .get<ApiResponse<ExceptionLogResponse>>(`${this.endpoint}/${id}`)
      .pipe(map((response) => response.data));
  }

  getByParkingDoor(doorNumber: string): Observable<ExceptionLogResponse[]> {
    return this.http
      .get<ApiResponse<ExceptionLogResponse[]>>(
        `${this.endpoint}/door/${doorNumber}`
      )
      .pipe(map((response) => response.data));
  }

  getUnsynced(): Observable<ExceptionLogResponse[]> {
    return this.http
      .get<ApiResponse<ExceptionLogResponse[]>>(`${this.endpoint}/sync/pending`)
      .pipe(map((response) => response.data));
  }

  create(log: ExceptionLogRequest): Observable<CreateResponse> {
    return this.http.post<CreateResponse>(this.endpoint, log);
  }

  update(
    id: string,
    updates: ExceptionLogUpdateRequest
  ): Observable<UpdateResponse> {
    return this.http.patch<UpdateResponse>(`${this.endpoint}/${id}`, updates);
  }

  delete(id: string): Observable<DeleteResponse> {
    return this.http.delete<DeleteResponse>(`${this.endpoint}/${id}`);
  }
}
