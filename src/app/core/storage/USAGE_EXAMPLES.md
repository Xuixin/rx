# Storage Layer - Usage Examples

## 📌 Setup

### 1. Import StorageModule in AppModule

```typescript
// app.module.ts
import { StorageModule } from "./core/storage";

@NgModule({
  imports: [
    // ... other imports
    StorageModule,
  ],
})
export class AppModule {}
```

### 2. Initialize in App Component

```typescript
// app.component.ts
import { Component, OnInit } from "@angular/core";
import { StorageFacade } from "./core/storage";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  constructor(private storage: StorageFacade) {}

  async ngOnInit() {
    await this.storage.initialize();
    console.log("Storage initialized!");
  }
}
```

---

## 🔹 Transaction Examples

### Create Transaction

```typescript
import { StorageFacade, Transaction } from "@app/core/storage";

export class CheckInPage {
  constructor(private storage: StorageFacade) {}

  async checkIn() {
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      userName: "สมชาย ใจดี",
      status: "IN",
      subject: ["ติดต่อราชการ"],
      organization: ["org-001"],
      licensePlateNumber: "กก 1234",
      phoneNumber: "0812345678",
      parkingDoorNumber: "A1",
      entryTime: new Date(),
      exitTime: new Date(),
      files: [],
      isSynced: false,
    };

    const created = await this.storage.createTransaction(transaction);
    console.log("Created:", created);
  }
}
```

### Get All Transactions

```typescript
async getAllTransactions() {
  const transactions = await this.storage.getAllTransactions();
  console.log('All transactions:', transactions);
}
```

### Get by Status

```typescript
async getPendingTransactions() {
  const pending = await this.storage.getTransactionsByStatus('PENDING');
  console.log('Pending:', pending);
}
```

### Update Transaction

```typescript
async updateStatus(id: string) {
  const updated = await this.storage.updateTransaction(id, {
    status: 'OUT',
    exitTime: new Date(),
  });
  console.log('Updated:', updated);
}
```

### Delete Transaction

```typescript
async deleteTransaction(id: string) {
  const deleted = await this.storage.deleteTransaction(id);
  console.log('Deleted:', deleted);
}
```

### Reactive Query (Watch Changes)

```typescript
import { Component, OnInit } from "@angular/core";
import { Observable } from "rxjs";

export class TransactionListPage implements OnInit {
  transactions$: Observable<Transaction[]>;

  constructor(private storage: StorageFacade) {}

  ngOnInit() {
    // Auto-updates when data changes!
    this.transactions$ = this.storage.watchAllTransactions();
  }
}
```

```html
<!-- transaction-list.page.html -->
<ion-list>
  <ion-item *ngFor="let txn of transactions$ | async">
    <ion-label>
      <h2>{{ txn.userName }}</h2>
      <p>{{ txn.licensePlateNumber }} - {{ txn.status }}</p>
    </ion-label>
  </ion-item>
</ion-list>
```

---

## 🔹 Exception Log Examples

### Create Exception Log

```typescript
async logError(error: any) {
  const log: ExceptionLog = {
    id: `log-${Date.now()}`,
    message: error.message,
    serviceName: 'CheckInService',
    errorType: error.name,
    code: 'ERR_001',
    timestamp: new Date(),
    parkingDoorNumber: 'A1',
    isSynced: false,
  };

  await this.storage.createExceptionLog(log);
}
```

### Get Logs by Parking Door

```typescript
async getLogsForDoor(doorNumber: string) {
  const logs = await this.storage.getExceptionLogsByParkingDoor(doorNumber);
  console.log('Logs for door:', logs);
}
```

### Watch Logs Reactively

```typescript
logs$: Observable<ExceptionLog[]>;

ngOnInit() {
  this.logs$ = this.storage.watchAllExceptionLogs();
}
```

---

## 🔹 Sync Operations

### Get Unsynced Data

```typescript
async getSyncQueue() {
  const unsyncedTxns = await this.storage.getUnsyncedTransactions();
  const unsyncedLogs = await this.storage.getUnsyncedExceptionLogs();

  console.log('Need to sync:', {
    transactions: unsyncedTxns.length,
    logs: unsyncedLogs.length,
  });
}
```

### Mark as Synced

```typescript
async syncToServer(txn: Transaction) {
  try {
    // 1. Send to server
    await this.apiService.uploadTransaction(txn);

    // 2. Mark as synced
    await this.storage.syncTransaction(txn.id);

    console.log('Synced successfully!');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}
```

### Bulk Sync

```typescript
async syncAll() {
  const unsyncedTxns = await this.storage.getUnsyncedTransactions();

  for (const txn of unsyncedTxns) {
    try {
      await this.apiService.uploadTransaction(txn);
      await this.storage.syncTransaction(txn.id);
    } catch (error) {
      await this.storage.createExceptionLog({
        id: `log-${Date.now()}`,
        message: `Failed to sync transaction ${txn.id}`,
        serviceName: 'SyncService',
        errorType: 'SyncError',
        code: 'SYNC_001',
        timestamp: new Date(),
        parkingDoorNumber: txn.parkingDoorNumber,
        isSynced: false,
      });
    }
  }
}
```

---

## 🔹 Advanced: Service Layer Pattern

```typescript
// services/transaction.service.ts
import { Injectable } from "@angular/core";
import { StorageFacade, Transaction } from "@app/core/storage";

@Injectable({
  providedIn: "root",
})
export class TransactionService {
  constructor(private storage: StorageFacade) {}

  async checkIn(data: Partial<Transaction>): Promise<Transaction> {
    const transaction: Transaction = {
      id: `txn-${Date.now()}`,
      status: "IN",
      entryTime: new Date(),
      exitTime: new Date(),
      isSynced: false,
      ...data,
    } as Transaction;

    return this.storage.createTransaction(transaction);
  }

  async checkOut(id: string): Promise<Transaction> {
    return this.storage.updateTransaction(id, {
      status: "OUT",
      exitTime: new Date(),
    });
  }

  async getActiveTransactions(): Promise<Transaction[]> {
    return this.storage.getTransactionsByStatus("IN");
  }
}
```

---

## 🔄 How to Switch Database (Example: RxDB → WatermelonDB)

### Step 1: Create WatermelonDB Implementation

```typescript
// implementations/watermelon/watermelon.service.ts
import { Injectable } from "@angular/core";
import { IDatabase } from "../../interfaces/database.interface";
import Database from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

@Injectable()
export class WatermelonDbService implements IDatabase {
  private db: Database;

  async init(): Promise<void> {
    const adapter = new SQLiteAdapter({
      dbName: "workflow",
      schema: mySchema,
    });

    this.db = new Database({
      adapter,
      modelClasses: [TransactionModel, ExceptionLogModel],
    });
  }

  isInitialized(): boolean {
    return !!this.db;
  }

  async destroy(): Promise<void> {
    // Cleanup
  }
}
```

### Step 2: Create Repository Implementation

```typescript
// implementations/watermelon/watermelon-transaction.repository.ts
import { Injectable } from "@angular/core";
import { TransactionRepository } from "../../repositories";
import { Transaction } from "../../models";

@Injectable()
export class WatermelonTransactionRepository extends TransactionRepository {
  constructor(private watermelonDb: WatermelonDbService) {
    super();
  }

  async findAll(): Promise<Transaction[]> {
    // Implement using WatermelonDB API
  }

  // ... implement all other methods
}
```

### Step 3: Update StorageModule

```typescript
// storage.module.ts
@NgModule({
  providers: [
    // OLD: RxDB
    // RxDbService,
    // { provide: DATABASE_TOKEN, useExisting: RxDbService },
    // { provide: TransactionRepository, useClass: RxDbTransactionRepository },

    // NEW: WatermelonDB
    WatermelonDbService,
    { provide: DATABASE_TOKEN, useExisting: WatermelonDbService },
    { provide: TransactionRepository, useClass: WatermelonTransactionRepository },
  ],
})
export class StorageModule {}
```

**Done!** No other code needs to change. All components, services, and pages continue working as before! 🎉

---

## 🧪 Testing

### Mock StorageFacade

```typescript
// transaction.page.spec.ts
import { TestBed } from "@angular/core/testing";
import { StorageFacade } from "@app/core/storage";
import { of } from "rxjs";

describe("TransactionPage", () => {
  let storageMock: jasmine.SpyObj<StorageFacade>;

  beforeEach(() => {
    storageMock = jasmine.createSpyObj("StorageFacade", ["createTransaction", "getAllTransactions", "watchAllTransactions"]);

    storageMock.watchAllTransactions.and.returnValue(of([]));

    TestBed.configureTestingModule({
      providers: [{ provide: StorageFacade, useValue: storageMock }],
    });
  });

  it("should create transaction", async () => {
    const txn = { id: "1", userName: "Test" } as Transaction;
    storageMock.createTransaction.and.returnValue(Promise.resolve(txn));

    // Test your component...
  });
});
```

---

## 💡 Best Practices

1. **Always use StorageFacade** - Don't inject repositories directly unless you have a good reason
2. **Initialize once** - Call `storage.initialize()` in AppComponent
3. **Use reactive queries** - For real-time updates in UI
4. **Handle errors** - Wrap storage calls in try-catch
5. **Use service layer** - Don't call storage directly from components for complex logic
6. **Domain models** - Always work with domain models (`Transaction`, `ExceptionLog`), never with raw database documents
