import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Abstract repositories
import { TransactionRepository, ExceptionLogRepository } from './repositories';

// RxDB implementations
import {
  RxDbService,
  RxDbTransactionRepository,
  RxDbExceptionLogRepository,
} from './implementations/rxdb';

// Facade
import { StorageFacade, DATABASE_TOKEN } from './storage.facade';

/**
 * Storage Module - Provides database abstraction layer
 *
 * To switch database implementations:
 * 1. Create new implementation classes (e.g., WatermelonDbService, WatermelonTransactionRepository)
 * 2. Update the providers below to use the new implementations
 * 3. No other code needs to change!
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    // Database implementation
    RxDbService,
    {
      provide: DATABASE_TOKEN,
      useExisting: RxDbService,
    },

    // Repository implementations
    {
      provide: TransactionRepository,
      useClass: RxDbTransactionRepository,
    },
    {
      provide: ExceptionLogRepository,
      useClass: RxDbExceptionLogRepository,
    },

    // Facade (main API)
    StorageFacade,
  ],
})
export class StorageModule {}
