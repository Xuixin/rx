import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionApiService, ExceptionLogApiService } from './services';
import {
  TransactionRequest,
  TransactionResponse,
  TransactionUpdateRequest,
  ExceptionLogRequest,
  ExceptionLogResponse,
  ExceptionLogUpdateRequest,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from './models/api-models';

/**
 * API Facade - Simplified API for all HTTP operations
 *
 * Benefits:
 * - Single point of access for all API calls
 * - Hides implementation complexity
 * - Easy to swap HTTP implementations (Fetch → HttpClient → Axios)
 * - Clean, domain-focused API
 */
@Injectable()
export class ApiFacade {
  constructor(
    private transactionApi: TransactionApiService,
    private exceptionLogApi: ExceptionLogApiService
  ) {}

  // ============================================
  // Transaction API
  // ============================================

  /**
   * Get all transactions from server
   */
  getAllTransactions(): Observable<TransactionResponse[]> {
    return this.transactionApi.getAll();
  }

  /**
   * Get transaction by ID
   */
  getTransaction(id: string): Observable<TransactionResponse> {
    return this.transactionApi.getById(id);
  }

  /**
   * Get transactions by status
   */
  getTransactionsByStatus(
    status: 'IN' | 'OUT' | 'PENDING'
  ): Observable<TransactionResponse[]> {
    return this.transactionApi.getByStatus(status);
  }

  /**
   * Get unsynced transactions
   */
  getUnsyncedTransactions(): Observable<TransactionResponse[]> {
    return this.transactionApi.getUnsynced();
  }

  /**
   * Create new transaction on server
   */
  createTransaction(
    transaction: TransactionRequest
  ): Observable<CreateResponse> {
    return this.transactionApi.create(transaction);
  }

  /**
   * Update transaction on server
   */
  updateTransaction(
    id: string,
    updates: TransactionUpdateRequest
  ): Observable<UpdateResponse> {
    return this.transactionApi.update(id, updates);
  }

  /**
   * Delete transaction from server
   */
  deleteTransaction(id: string): Observable<DeleteResponse> {
    return this.transactionApi.delete(id);
  }

  /**
   * Mark transaction as synced
   */
  markTransactionAsSynced(id: string): Observable<UpdateResponse> {
    return this.transactionApi.update(id, { isSynced: true });
  }

  // ============================================
  // Exception Log API
  // ============================================

  /**
   * Get all exception logs from server
   */
  getAllExceptionLogs(): Observable<ExceptionLogResponse[]> {
    return this.exceptionLogApi.getAll();
  }

  /**
   * Get exception log by ID
   */
  getExceptionLog(id: string): Observable<ExceptionLogResponse> {
    return this.exceptionLogApi.getById(id);
  }

  /**
   * Get exception logs by parking door
   */
  getExceptionLogsByParkingDoor(
    doorNumber: string
  ): Observable<ExceptionLogResponse[]> {
    return this.exceptionLogApi.getByParkingDoor(doorNumber);
  }

  /**
   * Get unsynced exception logs
   */
  getUnsyncedExceptionLogs(): Observable<ExceptionLogResponse[]> {
    return this.exceptionLogApi.getUnsynced();
  }

  /**
   * Create new exception log on server
   */
  createExceptionLog(log: ExceptionLogRequest): Observable<CreateResponse> {
    return this.exceptionLogApi.create(log);
  }

  /**
   * Update exception log on server
   */
  updateExceptionLog(
    id: string,
    updates: ExceptionLogUpdateRequest
  ): Observable<UpdateResponse> {
    return this.exceptionLogApi.update(id, updates);
  }

  /**
   * Delete exception log from server
   */
  deleteExceptionLog(id: string): Observable<DeleteResponse> {
    return this.exceptionLogApi.delete(id);
  }

  /**
   * Mark exception log as synced
   */
  markExceptionLogAsSynced(id: string): Observable<UpdateResponse> {
    return this.exceptionLogApi.update(id, { isSynced: true });
  }
}
