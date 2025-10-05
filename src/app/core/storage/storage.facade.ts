import { Injectable, Inject, InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { TransactionRepository, ExceptionLogRepository } from './repositories';
import { Transaction, ExceptionLog } from './models';
import { IDatabase } from './interfaces/database.interface';

// Injection token for IDatabase
export const DATABASE_TOKEN = new InjectionToken<IDatabase>('Database');

/**
 * Storage Facade - Simplified API for the entire storage layer
 * This is the main entry point for the rest of the application
 *
 * Benefits:
 * - Single point of access for all storage operations
 * - Hides implementation complexity
 * - Makes it easy to swap database implementations
 * - Provides a clean, domain-focused API
 */
@Injectable()
export class StorageFacade {
  constructor(
    @Inject(DATABASE_TOKEN) private database: IDatabase,
    private transactionRepo: TransactionRepository,
    private exceptionLogRepo: ExceptionLogRepository
  ) {}

  // ============================================
  // Database Lifecycle
  // ============================================
  async initialize(): Promise<void> {
    await this.database.init();
  }

  async destroy(): Promise<void> {
    await this.database.destroy();
  }

  isReady(): boolean {
    return this.database.isInitialized();
  }

  // ============================================
  // Transaction Operations
  // ============================================
  async getTransaction(id: string): Promise<Transaction | null> {
    return this.transactionRepo.findById(id);
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.findAll();
  }

  async getTransactionsByStatus(
    status: 'IN' | 'OUT' | 'PENDING'
  ): Promise<Transaction[]> {
    return this.transactionRepo.findByStatus(status);
  }

  async getUnsyncedTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.findUnsynced();
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    return this.transactionRepo.insert(transaction);
  }

  async createTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    return this.transactionRepo.bulkInsert(transactions);
  }

  async updateTransaction(
    id: string,
    updates: Partial<Transaction>
  ): Promise<Transaction> {
    return this.transactionRepo.update(id, updates);
  }

  async deleteTransaction(id: string): Promise<boolean> {
    return this.transactionRepo.delete(id);
  }

  async syncTransaction(id: string): Promise<Transaction> {
    return this.transactionRepo.markAsSynced(id);
  }

  // Reactive queries
  watchAllTransactions(): Observable<Transaction[]> {
    return this.transactionRepo.findAll$();
  }

  watchTransaction(id: string): Observable<Transaction | null> {
    return this.transactionRepo.findById$(id);
  }

  // ============================================
  // Exception Log Operations
  // ============================================
  async getExceptionLog(id: string): Promise<ExceptionLog | null> {
    return this.exceptionLogRepo.findById(id);
  }

  async getAllExceptionLogs(): Promise<ExceptionLog[]> {
    return this.exceptionLogRepo.findAll();
  }

  async getExceptionLogsByParkingDoor(
    doorNumber: string
  ): Promise<ExceptionLog[]> {
    return this.exceptionLogRepo.findByParkingDoor(doorNumber);
  }

  async getUnsyncedExceptionLogs(): Promise<ExceptionLog[]> {
    return this.exceptionLogRepo.findUnsynced();
  }

  async createExceptionLog(log: ExceptionLog): Promise<ExceptionLog> {
    return this.exceptionLogRepo.insert(log);
  }

  async createExceptionLogs(logs: ExceptionLog[]): Promise<ExceptionLog[]> {
    return this.exceptionLogRepo.bulkInsert(logs);
  }

  async updateExceptionLog(
    id: string,
    updates: Partial<ExceptionLog>
  ): Promise<ExceptionLog> {
    return this.exceptionLogRepo.update(id, updates);
  }

  async deleteExceptionLog(id: string): Promise<boolean> {
    return this.exceptionLogRepo.delete(id);
  }

  async syncExceptionLog(id: string): Promise<ExceptionLog> {
    return this.exceptionLogRepo.markAsSynced(id);
  }

  // Reactive queries
  watchAllExceptionLogs(): Observable<ExceptionLog[]> {
    return this.exceptionLogRepo.findAll$();
  }

  watchExceptionLog(id: string): Observable<ExceptionLog | null> {
    return this.exceptionLogRepo.findById$(id);
  }
}
