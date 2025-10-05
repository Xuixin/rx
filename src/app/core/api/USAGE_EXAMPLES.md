# API Layer - Usage Examples

## 📦 Setup

### 1. Import ApiModule in AppModule

```typescript
// app.module.ts
import { ApiModule } from "./core/api";
import { StorageModule } from "./core/storage";

@NgModule({
  imports: [
    // ... other imports
    StorageModule, // Local database
    ApiModule, // HTTP API
  ],
})
export class AppModule {}
```

---

## 🌐 Basic API Usage

### Example 1: Get All Transactions

```typescript
import { Component, OnInit } from "@angular/core";
import { ApiFacade } from "./core/api";

@Component({
  selector: "app-transaction-list",
  template: `
    <ion-list>
      <ion-item *ngFor="let txn of transactions">
        <ion-label>
          <h2>{{ txn.userName }}</h2>
          <p>{{ txn.licensePlateNumber }} - {{ txn.status }}</p>
        </ion-label>
      </ion-item>
    </ion-list>
  `,
})
export class TransactionListPage implements OnInit {
  transactions: any[] = [];

  constructor(private api: ApiFacade) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.api.getAllTransactions().subscribe({
      next: (transactions) => {
        this.transactions = transactions;
        console.log("Loaded:", transactions.length);
      },
      error: (error) => {
        console.error("Error loading transactions:", error);
      },
    });
  }
}
```

### Example 2: Create Transaction

```typescript
async createTransaction() {
  const newTransaction = {
    userName: 'สมชาย ใจดี',
    status: 'IN' as const,
    licensePlateNumber: 'กก 1234',
    phoneNumber: '0812345678',
    parkingDoorNumber: 'A1',
    entryTime: new Date().toISOString(),
    exitTime: new Date().toISOString(),
    subject: ['ติดต่อราชการ'],
    organization: ['org-001'],
  };

  this.api.createTransaction(newTransaction).subscribe({
    next: (response) => {
      console.log('✅ Created:', response.id);
      this.loadTransactions(); // Reload list
    },
    error: (error) => {
      console.error('❌ Create failed:', error);
    }
  });
}
```

---

## 🔄 Offline-First Pattern (API + Storage)

### Sync Service

```typescript
import { Injectable } from "@angular/core";
import { ApiFacade } from "../core/api";
import { StorageFacade } from "../core/storage";
import { InternetService } from "../service/internet.service";

@Injectable({
  providedIn: "root",
})
export class SyncService {
  constructor(private api: ApiFacade, private storage: StorageFacade, private internet: InternetService) {}

  /**
   * Save data offline-first
   */
  async saveTransaction(data: any) {
    // 1. Save to local storage first (instant)
    const localTransaction = {
      id: `txn-${Date.now()}`,
      ...data,
      isSynced: false,
    };

    await this.storage.createTransaction(localTransaction);
    console.log("✅ Saved locally");

    // 2. Try to sync to server if online
    if (this.internet.isConnected()) {
      this.syncToServer(localTransaction.id);
    }
  }

  /**
   * Sync to server
   */
  private syncToServer(id: string) {
    this.storage.getTransaction(id).then((txn) => {
      if (!txn) return;

      // Upload to server
      this.api.createTransaction(txn).subscribe({
        next: async (response) => {
          // Mark as synced in local storage
          await this.storage.syncTransaction(id);
          console.log("✅ Synced to server:", id);
        },
        error: async (error) => {
          console.error("❌ Sync failed:", error);

          // Log error
          await this.storage.createExceptionLog({
            id: `log-${Date.now()}`,
            message: `Sync failed: ${error.message}`,
            serviceName: "SyncService",
            errorType: "NetworkError",
            code: "SYNC_001",
            timestamp: new Date().toISOString(),
            parkingDoorNumber: txn.parkingDoorNumber,
            isSynced: false,
          });
        },
      });
    });
  }

  /**
   * Sync all pending transactions
   */
  async syncAllPending() {
    if (!this.internet.isConnected()) {
      console.log("❌ Offline - cannot sync");
      return;
    }

    const unsyncedTransactions = await this.storage.getUnsyncedTransactions();
    console.log(`🔄 Syncing ${unsyncedTransactions.length} transactions...`);

    for (const txn of unsyncedTransactions) {
      await this.syncToServer(txn.id);
    }

    console.log("✅ Sync completed!");
  }
}
```

---

## 📱 Component with Sync

```typescript
import { Component, OnInit } from "@angular/core";
import { SyncService } from "../services/sync.service";
import { StorageFacade } from "../core/storage";
import { InternetService } from "../service/internet.service";

@Component({
  selector: "app-check-in",
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Check In</ion-title>
        <ion-chip slot="end" [color]="isOnline() ? 'success' : 'danger'">
          <ion-icon [name]="isOnline() ? 'wifi' : 'wifi-outline'"></ion-icon>
          <ion-label>{{ isOnline() ? "Online" : "Offline" }}</ion-label>
        </ion-chip>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-button (click)="checkIn()">Check In</ion-button>
      <ion-button (click)="syncAll()" [disabled]="!isOnline()"> Sync All </ion-button>

      <p>Unsynced: {{ unsyncedCount }}</p>
    </ion-content>
  `,
})
export class CheckInPage implements OnInit {
  isOnline = this.internet.online;
  unsyncedCount = 0;

  constructor(private syncService: SyncService, private storage: StorageFacade, private internet: InternetService) {}

  async ngOnInit() {
    await this.updateUnsyncedCount();
  }

  async checkIn() {
    await this.syncService.saveTransaction({
      userName: "สมชาย ใจดี",
      status: "IN",
      licensePlateNumber: "กก 1234",
      phoneNumber: "0812345678",
      parkingDoorNumber: "A1",
      entryTime: new Date().toISOString(),
      exitTime: new Date().toISOString(),
    });

    await this.updateUnsyncedCount();
  }

  async syncAll() {
    await this.syncService.syncAllPending();
    await this.updateUnsyncedCount();
  }

  private async updateUnsyncedCount() {
    const unsynced = await this.storage.getUnsyncedTransactions();
    this.unsyncedCount = unsynced.length;
  }
}
```

---

## 🎯 Advanced Patterns

### Pattern 1: Optimistic UI Update

```typescript
async updateTransactionStatus(id: string, status: string) {
  // 1. Update UI immediately (optimistic)
  await this.storage.updateTransaction(id, { status });

  // 2. Sync to server in background
  if (this.internet.isConnected()) {
    this.api.updateTransaction(id, { status }).subscribe({
      next: () => console.log('✅ Synced'),
      error: async () => {
        // Revert on error
        await this.storage.updateTransaction(id, {
          status: 'PENDING' // Revert to original
        });
      }
    });
  }
}
```

### Pattern 2: Auto-Sync on Reconnect

```typescript
@Injectable()
export class AutoSyncService {
  constructor(private syncService: SyncService, private internet: InternetService) {
    // Watch connection status
    effect(() => {
      if (this.internet.online()) {
        console.log("📡 Back online - auto syncing...");
        this.syncService.syncAllPending();
      }
    });
  }
}
```

### Pattern 3: Retry with Exponential Backoff

```typescript
import { retry, timer } from 'rxjs';

syncWithRetry(transaction: any) {
  return this.api.createTransaction(transaction).pipe(
    retry({
      count: 3,
      delay: (error, retryCount) => {
        const delay = Math.pow(2, retryCount) * 1000;
        console.log(`Retry ${retryCount} in ${delay}ms...`);
        return timer(delay);
      }
    })
  );
}
```

### Pattern 4: Batch Upload

```typescript
import { forkJoin } from 'rxjs';

async batchSync() {
  const pending = await this.storage.getUnsyncedTransactions();

  const requests = pending.map(txn =>
    this.api.createTransaction(txn)
  );

  // Upload all in parallel
  forkJoin(requests).subscribe({
    next: (results) => {
      console.log('✅ All uploaded:', results.length);

      // Mark all as synced
      results.forEach((_, index) => {
        this.storage.syncTransaction(pending[index].id);
      });
    },
    error: (error) => {
      console.error('❌ Some uploads failed:', error);
    }
  });
}
```

---

## 🧪 Testing

### Mock ApiFacade

```typescript
describe("CheckInPage", () => {
  let apiFacadeMock: jasmine.SpyObj<ApiFacade>;
  let storageFacadeMock: jasmine.SpyObj<StorageFacade>;

  beforeEach(() => {
    apiFacadeMock = jasmine.createSpyObj("ApiFacade", ["createTransaction", "getAllTransactions"]);

    storageFacadeMock = jasmine.createSpyObj("StorageFacade", ["createTransaction", "getUnsyncedTransactions"]);

    apiFacadeMock.createTransaction.and.returnValue(of({ message: "Created", id: "test-id" }));

    storageFacadeMock.getUnsyncedTransactions.and.returnValue(Promise.resolve([]));

    TestBed.configureTestingModule({
      providers: [
        { provide: ApiFacade, useValue: apiFacadeMock },
        { provide: StorageFacade, useValue: storageFacadeMock },
      ],
    });
  });

  it("should create transaction via API", () => {
    const component = TestBed.inject(CheckInPage);
    component.checkIn();

    expect(apiFacadeMock.createTransaction).toHaveBeenCalled();
  });
});
```

---

## 📊 Summary

### When to Use Each Layer

| Scenario            | Use                         |
| ------------------- | --------------------------- |
| **Always online**   | API Facade only             |
| **Offline-first**   | Storage Facade + API Facade |
| **Real-time UI**    | Storage Facade (reactive)   |
| **Background sync** | SyncService                 |

### Data Flow

```
User Action
    ↓
1. Save to Storage (instant)
    ↓
2. Update UI (from Storage)
    ↓
3. Check Internet
    ↓ (online)
4. Sync to API
    ↓
5. Mark as synced in Storage
```

---

**Perfect for offline-first mobile apps! 🚀**
