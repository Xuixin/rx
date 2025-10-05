# Migration Guide: Old RxDB Service → New Storage Layer

## 📊 Before vs After Comparison

### ❌ Before (Tightly Coupled to RxDB)

```typescript
// Component directly depends on RxDB
import { RxDbService } from "./core/rxdb/rx_db.service";

export class MyComponent {
  constructor(private rxDb: RxDbService) {}

  async ngOnInit() {
    await this.rxDb.init();

    // Directly using RxDB API
    const db = this.rxDb.database;
    const txns = await db.txns.find().exec();

    // Working with RxDB document format
    const txnData = txns.map((doc) => doc.toJSON());
  }
}
```

**Problems:**

- ❌ Tightly coupled to RxDB
- ❌ RxDB types leak everywhere
- ❌ Hard to test (need real database)
- ❌ Can't swap database without refactoring entire codebase
- ❌ Business logic mixed with data access

---

### ✅ After (Abstracted with Facade)

```typescript
// Component depends on abstraction
import { StorageFacade, Transaction } from "./core/storage";

export class MyComponent {
  constructor(private storage: StorageFacade) {}

  async ngOnInit() {
    await this.storage.initialize();

    // Clean, domain-focused API
    const txns = await this.storage.getAllTransactions();

    // Working with domain models
    console.log(txns[0].userName); // Type-safe!
  }
}
```

**Benefits:**

- ✅ Loosely coupled
- ✅ Clean domain models
- ✅ Easy to test (mock StorageFacade)
- ✅ Can swap database by changing one module
- ✅ Separation of concerns

---

## 🔄 Migration Steps

### Step 1: Import StorageModule

```typescript
// app.module.ts
import { StorageModule } from "./core/storage";

@NgModule({
  imports: [
    // ... existing imports
    StorageModule, // Add this
  ],
})
export class AppModule {}
```

### Step 2: Replace RxDbService Injection

**Before:**

```typescript
import { RxDbService } from './core/rxdb/rx_db.service';

constructor(private rxDb: RxDbService) {}
```

**After:**

```typescript
import { StorageFacade } from './core/storage';

constructor(private storage: StorageFacade) {}
```

### Step 3: Update Initialization

**Before:**

```typescript
async ngOnInit() {
  await this.rxDb.init();
}
```

**After:**

```typescript
async ngOnInit() {
  await this.storage.initialize();
}
```

### Step 4: Replace Data Access Patterns

#### 📝 Create Document

**Before:**

```typescript
const db = this.rxDb.database;
await db.txns.insert({
  id: "txn-001",
  payload: {
    user_name: "John",
    status: "IN",
    is_sync: false,
    // ... more fields
  },
  createdAt: Date.now(),
});
```

**After:**

```typescript
await this.storage.createTransaction({
  id: "txn-001",
  userName: "John",
  status: "IN",
  isSynced: false,
  // ... clean camelCase fields
});
```

#### 📖 Read All Documents

**Before:**

```typescript
const db = this.rxDb.database;
const docs = await db.txns.find().exec();
const txns = docs.map((doc) => doc.toJSON());
```

**After:**

```typescript
const txns = await this.storage.getAllTransactions();
```

#### 🔍 Query by Field

**Before:**

```typescript
const db = this.rxDb.database;
const docs = await db.txns.find({ selector: { "payload.status": "PENDING" } }).exec();
const pending = docs.map((doc) => doc.toJSON());
```

**After:**

```typescript
const pending = await this.storage.getTransactionsByStatus("PENDING");
```

#### ✏️ Update Document

**Before:**

```typescript
const db = this.rxDb.database;
const doc = await db.txns.findOne({ selector: { id: "txn-001" } }).exec();
if (doc) {
  await doc.patch({
    payload: {
      ...doc.payload,
      status: "OUT",
    },
  });
}
```

**After:**

```typescript
await this.storage.updateTransaction("txn-001", { status: "OUT" });
```

#### 🗑️ Delete Document

**Before:**

```typescript
const db = this.rxDb.database;
const doc = await db.txns.findOne({ selector: { id: "txn-001" } }).exec();
if (doc) {
  await doc.remove();
}
```

**After:**

```typescript
await this.storage.deleteTransaction("txn-001");
```

#### 📡 Reactive Queries

**Before:**

```typescript
const db = this.rxDb.database;
db.txns.find().$.subscribe((docs) => {
  const txns = docs.map((d) => d.toJSON());
  console.log(txns);
});
```

**After:**

```typescript
this.storage.watchAllTransactions().subscribe((txns) => {
  console.log(txns);
});
```

---

## 🎯 Real-World Example

### Old Code (app.component.ts)

```typescript
import { Component, OnInit } from "@angular/core";
import { RxDbService } from "./core/rxdb/rx_db.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  transactions: any[] = [];

  constructor(private rxDb: RxDbService) {}

  async ngOnInit() {
    await this.rxDb.init();

    const db = this.rxDb.database;

    // Subscribe to changes
    db.txns.find().$.subscribe((docs) => {
      this.transactions = docs.map((doc) => {
        const data = doc.toJSON();
        return {
          id: data.id,
          userName: data.payload.user_name,
          status: data.payload.status,
          licensePlate: data.payload.license_plate_number,
        };
      });
    });
  }

  async addTransaction() {
    const db = this.rxDb.database;
    await db.txns.insert({
      id: `txn-${Date.now()}`,
      payload: {
        user_name: "สมชาย",
        status: "IN",
        subject: ["ติดต่อราชการ"],
        organization: ["org-001"],
        license_plate_number: "กก 1234",
        phone_number: "0812345678",
        parking_door_number: "A1",
        entry_time: new Date(),
        exit_time: new Date(),
        is_sync: false,
      },
      createdAt: Date.now(),
    });
  }
}
```

### New Code (app.component.ts)

```typescript
import { Component, OnInit } from "@angular/core";
import { StorageFacade, Transaction } from "./core/storage";
import { Observable } from "rxjs";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
})
export class AppComponent implements OnInit {
  transactions$: Observable<Transaction[]>;

  constructor(private storage: StorageFacade) {}

  async ngOnInit() {
    await this.storage.initialize();

    // Much simpler!
    this.transactions$ = this.storage.watchAllTransactions();
  }

  async addTransaction() {
    await this.storage.createTransaction({
      id: `txn-${Date.now()}`,
      userName: "สมชาย",
      status: "IN",
      subject: ["ติดต่อราชการ"],
      organization: ["org-001"],
      licensePlateNumber: "กก 1234",
      phoneNumber: "0812345678",
      parkingDoorNumber: "A1",
      entryTime: new Date(),
      exitTime: new Date(),
      isSynced: false,
    });
  }
}
```

**Template (app.component.html):**

```html
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

## 🧪 Testing Improvements

### Before: Hard to Test

```typescript
describe("MyComponent", () => {
  let rxDbMock: any;

  beforeEach(() => {
    // Need to mock complex RxDB structure
    rxDbMock = {
      database: {
        txns: {
          find: () => ({
            exec: () => Promise.resolve([]),
            $: of([]),
          }),
          insert: jasmine.createSpy(),
        },
      },
    };
  });
});
```

### After: Easy to Test

```typescript
describe("MyComponent", () => {
  let storageMock: jasmine.SpyObj<StorageFacade>;

  beforeEach(() => {
    // Simple, clean mock
    storageMock = jasmine.createSpyObj("StorageFacade", ["initialize", "createTransaction", "getAllTransactions", "watchAllTransactions"]);

    storageMock.watchAllTransactions.and.returnValue(of([]));
  });
});
```

---

## 📋 Checklist

- [ ] Import `StorageModule` in `AppModule`
- [ ] Replace all `RxDbService` imports with `StorageFacade`
- [ ] Update all `rxDb.init()` to `storage.initialize()`
- [ ] Replace direct database access with facade methods
- [ ] Update models from snake_case to camelCase
- [ ] Update reactive queries to use `watch*()` methods
- [ ] Update tests to mock `StorageFacade`
- [ ] Remove old `core/rxdb/` imports from components (keep only in storage layer)

---

## 🎁 Bonus: TypeScript Safety

### Before: Weak Types

```typescript
const db = this.rxDb.database;
const txn = await db.txns.findOne().exec();
const data = txn.toJSON();

// No autocomplete, easy to make mistakes
console.log(data.payload.user_name); // ❌ Typo: user_nam
console.log(data.payload.unkown_field); // ❌ No error!
```

### After: Strong Types

```typescript
const txn = await this.storage.getTransaction("txn-001");

// Full autocomplete and type checking!
console.log(txn.userName); // ✅ Autocomplete
console.log(txn.unknown); // ✅ TypeScript error!
```

---

## 💡 Need Help?

If you have questions during migration:

1. Check `USAGE_EXAMPLES.md` for common patterns
2. Review `README.md` for architecture overview
3. Look at the facade implementation for available methods
