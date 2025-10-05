import { Injectable } from '@angular/core';
import { IRepository } from '../interfaces/database.interface';
import { ExceptionLog } from '../models';

/**
 * Abstract Exception Log Repository
 * This defines the contract for exception log data access
 */
@Injectable()
export abstract class ExceptionLogRepository
  implements IRepository<ExceptionLog>
{
  abstract findById(id: string): Promise<ExceptionLog | null>;
  abstract findAll(): Promise<ExceptionLog[]>;
  abstract find(query: Partial<ExceptionLog>): Promise<ExceptionLog[]>;
  abstract insert(doc: ExceptionLog): Promise<ExceptionLog>;
  abstract bulkInsert(docs: ExceptionLog[]): Promise<ExceptionLog[]>;
  abstract update(
    id: string,
    doc: Partial<ExceptionLog>
  ): Promise<ExceptionLog>;
  abstract delete(id: string): Promise<boolean>;
  abstract findAll$(): import('rxjs').Observable<ExceptionLog[]>;
  abstract findById$(
    id: string
  ): import('rxjs').Observable<ExceptionLog | null>;

  // Domain-specific methods
  abstract findByParkingDoor(doorNumber: string): Promise<ExceptionLog[]>;
  abstract findUnsynced(): Promise<ExceptionLog[]>;
  abstract markAsSynced(id: string): Promise<ExceptionLog>;
}
