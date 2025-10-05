# API Layer - Architecture Guide

## 🎯 Overview

API Layer provides **abstracted HTTP client** that can be easily swapped without affecting business logic.

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│          (Components, Pages, Services)                      │
└────────────────────┬────────────────────────────────────────┘
                     │ Uses
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                      ApiFacade                              │
│          (Single API, hides HTTP complexity)                │
└─────────┬──────────────────────────┬────────────────────────┘
          │                          │
          ↓                          ↓
┌──────────────────────┐  ┌──────────────────────────┐
│ TransactionApiService│  │ ExceptionLogApiService   │
│ (Abstract)           │  │ (Abstract)               │
└──────────┬───────────┘  └──────────┬───────────────┘
           │                         │
           ↓                         ↓
┌──────────────────────┐  ┌──────────────────────────┐
│ FetchTransactionApi  │  │ FetchExceptionLogApi     │
│ (Concrete - Fetch)   │  │ (Concrete - Fetch)       │
└──────────────────────┘  └──────────────────────────┘
```

## 📁 Structure

```
api/
├── interfaces/
│   └── http-client.interface.ts      # IHttpClient interface
├── models/
│   └── api-models.ts                 # Request/Response models
├── services/
│   ├── transaction-api.service.ts    # Abstract transaction API
│   └── exception-log-api.service.ts  # Abstract exception log API
├── implementations/
│   └── fetch/                        # Fetch API implementation
│       ├── fetch-http-client.service.ts
│       ├── fetch-transaction-api.service.ts
│       └── fetch-exception-log-api.service.ts
├── api.facade.ts                     # Main API (Facade Pattern)
├── api.module.ts                     # DI configuration
├── index.ts                          # Public exports
└── README.md                         # This file
```

## 💡 Usage

### Basic Usage (Recommended)

```typescript
import { ApiFacade } from '@app/core/api';

@Component({...})
export class MyComponent {
  constructor(private api: ApiFacade) {}

  async loadTransactions() {
    // Simple, clean API
    this.api.getAllTransactions().subscribe(transactions => {
      console.log('Transactions:', transactions);
    });
  }

  async createTransaction() {
    const transaction = {
      userName: 'John Doe',
      status: 'IN' as const,
      licensePlateNumber: 'ABC 123',
      phoneNumber: '0812345678',
      parkingDoorNumber: 'A1',
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
    };

    this.api.createTransaction(transaction).subscribe(response => {
      console.log('Created:', response);
    });
  }
}
```

### With Storage Layer (Offline-First Pattern)

```typescript
import { ApiFacade } from "@app/core/api";
import { StorageFacade } from "@app/core/storage";

@Injectable()
export class SyncService {
  constructor(private api: ApiFacade, private storage: StorageFacade, private internet: InternetService) {}

  /**
   * Sync local data to server when online
   */
  async syncToServer() {
    if (!this.internet.isConnected()) {
      console.log("Offline - skipping sync");
      return;
    }

    // Get unsynced data from local storage
    const unsyncedTransactions = await this.storage.getUnsyncedTransactions();

    for (const txn of unsyncedTransactions) {
      try {
        // Upload to server
        await this.api.createTransaction(txn).toPromise();

        // Mark as synced in local storage
        await this.storage.syncTransaction(txn.id);

        console.log("✅ Synced:", txn.id);
      } catch (error) {
        console.error("❌ Sync failed:", txn.id, error);

        // Log error
        await this.storage.createExceptionLog({
          id: `log-${Date.now()}`,
          message: `Failed to sync transaction ${txn.id}`,
          serviceName: "SyncService",
          errorType: "SyncError",
          code: "SYNC_001",
          timestamp: new Date().toISOString(),
          parkingDoorNumber: txn.parkingDoorNumber,
          isSynced: false,
        });
      }
    }
  }
}
```

## 🔄 How to Switch HTTP Implementation

### Current: Fetch API

```typescript
// api.module.ts
providers: [FetchHttpClientService, { provide: TransactionApiService, useClass: FetchTransactionApiService }];
```

### Switch to Angular HttpClient

**Step 1:** Create HttpClient implementation

```typescript
// implementations/http-client/http-client-transaction-api.service.ts
import { HttpClient } from "@angular/common/http";

@Injectable()
export class HttpClientTransactionApiService extends TransactionApiService {
  constructor(private http: HttpClient) {
    super();
  }

  getAll(): Observable<TransactionResponse[]> {
    return this.http.get<ApiResponse<TransactionResponse[]>>("/api/transactions").pipe(map((response) => response.data));
  }

  // ... implement other methods
}
```

**Step 2:** Update module

```typescript
// api.module.ts
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    { provide: TransactionApiService, useClass: HttpClientTransactionApiService },
  ]
})
```

**Done!** No other code needs to change.

## ✨ Benefits

### ✅ 1. Loose Coupling

- Components don't depend on specific HTTP library
- Easy to switch from Fetch → HttpClient → Axios

### ✅ 2. Testability

```typescript
describe("MyComponent", () => {
  let apiFacade: jasmine.SpyObj<ApiFacade>;

  beforeEach(() => {
    apiFacade = jasmine.createSpyObj("ApiFacade", ["getAllTransactions"]);
    apiFacade.getAllTransactions.and.returnValue(of([]));
  });
});
```

### ✅ 3. Offline-First Support

- Works perfectly with StorageFacade
- Easy to implement sync strategies
- Can queue failed requests

### ✅ 4. Type Safety

- Full TypeScript support
- Request/Response models
- Autocomplete everywhere

### ✅ 5. Centralized Configuration

- Base URL in one place
- Headers management
- Timeout configuration
- Error handling

## 📝 Example Patterns

### Pattern 1: Optimistic UI Update

```typescript
async updateTransactionStatus(id: string, status: string) {
  // 1. Update local storage immediately
  await this.storage.updateTransaction(id, { status });

  // 2. Update UI (instant)
  this.transactions$ = this.storage.watchAllTransactions();

  // 3. Sync to server in background
  if (this.internet.isConnected()) {
    this.api.updateTransaction(id, { status }).subscribe({
      next: () => console.log('✅ Synced'),
      error: (error) => {
        // Revert on error
        console.error('❌ Sync failed, reverting...');
      }
    });
  }
}
```

### Pattern 2: Retry with Exponential Backoff

```typescript
syncWithRetry(transaction: Transaction) {
  return this.api.createTransaction(transaction).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => timer(Math.pow(2, retryCount) * 1000)
    })
  );
}
```

### Pattern 3: Batch Operations

```typescript
async syncAllPending() {
  const pending = await this.storage.getUnsyncedTransactions();

  const requests = pending.map(txn =>
    this.api.createTransaction(txn)
  );

  // Parallel upload
  forkJoin(requests).subscribe({
    next: (results) => console.log('All synced!', results),
    error: (error) => console.error('Some failed', error)
  });
}
```

## 🚀 Future Enhancements

1. **Add interceptors** for auth tokens
2. **Request/Response logging**
3. **Caching layer**
4. **Request deduplication**
5. **WebSocket support**

---

**Built with clean architecture principles 🎯**
