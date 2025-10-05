import { Injectable } from '@angular/core';
import { IRepository } from '../interfaces/database.interface';
import { Transaction } from '../models';

/**
 * Abstract Transaction Repository
 * This defines the contract for transaction data access
 */
@Injectable()
export abstract class TransactionRepository
  implements IRepository<Transaction>
{
  abstract findById(id: string): Promise<Transaction | null>;
  abstract findAll(): Promise<Transaction[]>;
  abstract find(query: Partial<Transaction>): Promise<Transaction[]>;
  abstract insert(doc: Transaction): Promise<Transaction>;
  abstract bulkInsert(docs: Transaction[]): Promise<Transaction[]>;
  abstract update(id: string, doc: Partial<Transaction>): Promise<Transaction>;
  abstract delete(id: string): Promise<boolean>;
  abstract findAll$(): import('rxjs').Observable<Transaction[]>;
  abstract findById$(id: string): import('rxjs').Observable<Transaction | null>;

  // Domain-specific methods
  abstract findByStatus(
    status: 'IN' | 'OUT' | 'PENDING'
  ): Promise<Transaction[]>;
  abstract findUnsynced(): Promise<Transaction[]>;
  abstract markAsSynced(id: string): Promise<Transaction>;
}
