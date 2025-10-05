import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  TransactionRequest,
  TransactionResponse,
  TransactionUpdateRequest,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '../models/api-models';

/**
 * Abstract Transaction API Service
 * Defines the contract for transaction API operations
 */
@Injectable()
export abstract class TransactionApiService {
  abstract getAll(): Observable<TransactionResponse[]>;
  abstract getById(id: string): Observable<TransactionResponse>;
  abstract getByStatus(
    status: 'IN' | 'OUT' | 'PENDING'
  ): Observable<TransactionResponse[]>;
  abstract getUnsynced(): Observable<TransactionResponse[]>;
  abstract create(transaction: TransactionRequest): Observable<CreateResponse>;
  abstract update(
    id: string,
    updates: TransactionUpdateRequest
  ): Observable<UpdateResponse>;
  abstract delete(id: string): Observable<DeleteResponse>;
}
