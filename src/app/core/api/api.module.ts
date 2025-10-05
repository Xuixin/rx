import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Abstract services
import { TransactionApiService, ExceptionLogApiService } from './services';

// Fetch implementations
import {
  FetchHttpClientService,
  FetchTransactionApiService,
  FetchExceptionLogApiService,
} from './implementations/fetch';

// Facade
import { ApiFacade } from './api.facade';

/**
 * API Module - Provides HTTP abstraction layer
 *
 * To switch HTTP implementations:
 * 1. Create new implementation (e.g., HttpClientTransactionApiService)
 * 2. Update providers below
 * 3. No other code needs to change!
 *
 * Example implementations:
 * - Fetch API (current)
 * - Angular HttpClient
 * - Axios
 * - Custom HTTP library
 */
@NgModule({
  imports: [CommonModule],
  providers: [
    // HTTP Client
    FetchHttpClientService,

    // API Services
    {
      provide: TransactionApiService,
      useClass: FetchTransactionApiService,
    },
    {
      provide: ExceptionLogApiService,
      useClass: FetchExceptionLogApiService,
    },

    // Facade (main API)
    ApiFacade,
  ],
})
export class ApiModule {}
