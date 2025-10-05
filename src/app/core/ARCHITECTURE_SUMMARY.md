# สรุปสถาปัตยกรรม Storage Layer แบบใหม่

## 🎯 ปัญหาของโค้ดเดิม

```typescript
// ❌ ปัญหา: ผูกติดกับ RxDB โดยตรง
import { RxDbService } from "./rxdb/rx_db.service";

const db = rxDbService.database;
const docs = await db.txns.find().exec();
```

**ปัญหา:**

- ❌ ถ้าต้องการเปลี่ยนจาก RxDB → WatermelonDB หรือ PouchDB ต้องแก้โค้ดทุกที่
- ❌ Component/Service รู้จัก RxDB API โดยตรง (tight coupling)
- ❌ ยากต่อการเขียน unit test
- ❌ ไม่สามารถเปลี่ยน implementation ได้ง่าย

---

## ✅ โซลูชัน: Architecture แบบใหม่

### แนวคิดหลัก

1. **Abstraction (นามธรรม)** - สร้าง interface ไว้ก่อน แล้วค่อย implement
2. **Facade Pattern** - มี API เดียวสำหรับเข้าถึงทุกอย่าง
3. **Repository Pattern** - แยก data access logic ออกจาก business logic
4. **Dependency Injection** - inject abstraction ไม่ใช่ concrete class

---

## 📊 เปรียบเทียบโครงสร้าง

### เดิม (Old Structure)

```
core/
└── rxdb/
    ├── model/
    │   ├── rx_transaction_schema.ts   ← RxDB schema
    │   └── rx_log_schema.ts
    └── rx_db.service.ts                ← RxDB service
```

**ปัญหา:** ทุกอย่างผูกติดกับ RxDB

---

### ใหม่ (New Structure)

```
core/
└── storage/
    ├── interfaces/                     ← 1. Abstract interfaces
    │   └── database.interface.ts
    │
    ├── models/                         ← 2. Domain models (DB-independent)
    │   ├── transaction.model.ts
    │   └── exception-log.model.ts
    │
    ├── repositories/                   ← 3. Abstract repositories
    │   ├── transaction.repository.ts
    │   └── exception-log.repository.ts
    │
    ├── implementations/                ← 4. Concrete implementations
    │   └── rxdb/
    │       ├── rxdb.service.ts
    │       ├── rxdb-transaction.repository.ts
    │       └── rxdb-exception-log.repository.ts
    │
    ├── storage.facade.ts               ← 5. Main API
    ├── storage.module.ts               ← 6. DI Configuration
    └── index.ts                        ← 7. Public exports
```

---

## 🏗️ Layer Breakdown

### Layer 1: Interfaces (นามธรรม)

```typescript
// interfaces/database.interface.ts
export interface IDatabase {
  init(): Promise<void>;
  isInitialized(): boolean;
  destroy(): Promise<void>;
}

export interface IRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  insert(doc: T): Promise<T>;
  update(id: string, doc: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  // ... more
}
```

**ประโยชน์:** กำหนด contract ที่ทุก implementation ต้องทำตาม

---

### Layer 2: Domain Models (โมเดลธุรกิจ)

```typescript
// models/transaction.model.ts
export interface Transaction {
  id: string;
  userName: string; // ← camelCase, clean naming
  status: "IN" | "OUT" | "PENDING";
  licensePlateNumber: string;
  // ... more fields
}
```

**ประโยชน์:** ไม่ผูกติดกับ database schema, ใช้ naming ที่เหมาะกับ TypeScript

---

### Layer 3: Abstract Repositories

```typescript
// repositories/transaction.repository.ts
@Injectable()
export abstract class TransactionRepository implements IRepository<Transaction> {
  abstract findById(id: string): Promise<Transaction | null>;
  abstract findAll(): Promise<Transaction[]>;
  // ... CRUD methods

  // Domain-specific methods
  abstract findByStatus(status: "IN" | "OUT" | "PENDING"): Promise<Transaction[]>;
  abstract findUnsynced(): Promise<Transaction[]>;
}
```

**ประโยชน์:** กำหนด business operations ที่เฉพาะเจาะจงกับ Transaction

---

### Layer 4: Concrete Implementation (RxDB)

```typescript
// implementations/rxdb/rxdb-transaction.repository.ts
@Injectable()
export class RxDbTransactionRepository extends TransactionRepository {
  constructor(private rxDbService: RxDbService) {
    super();
  }

  async findAll(): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const docs = await db.txns.find().exec();
    return docs.map((doc) => this.mapToModel(doc.toJSON()));
  }

  // Map RxDB document → Domain model
  private mapToModel(doc: any): Transaction {
    return {
      id: doc.id,
      userName: doc.payload.user_name, // snake_case → camelCase
      status: doc.payload.status,
      // ...
    };
  }
}
```

**ประโยชน์:**

- RxDB-specific code อยู่ที่นี่อย่างเดียว
- ถ้าต้องการเปลี่ยน DB แค่สร้าง implementation ใหม่

---

### Layer 5: Storage Facade (API หลัก)

```typescript
// storage.facade.ts
@Injectable({ providedIn: "root" })
export class StorageFacade {
  constructor(@Inject(DATABASE_TOKEN) private database: IDatabase, private transactionRepo: TransactionRepository, private exceptionLogRepo: ExceptionLogRepository) {}

  // Clean, simple API
  async getAllTransactions(): Promise<Transaction[]> {
    return this.transactionRepo.findAll();
  }

  async createTransaction(txn: Transaction): Promise<Transaction> {
    return this.transactionRepo.insert(txn);
  }

  watchAllTransactions(): Observable<Transaction[]> {
    return this.transactionRepo.findAll$();
  }

  // ... more methods
}
```

**ประโยชน์:** Single point of access, ซ่อนความซับซ้อนภายใน

---

### Layer 6: Module (Dependency Injection)

```typescript
// storage.module.ts
@NgModule({
  providers: [
    // Database
    RxDbService,
    { provide: DATABASE_TOKEN, useExisting: RxDbService },

    // Repositories
    { provide: TransactionRepository, useClass: RxDbTransactionRepository },
    { provide: ExceptionLogRepository, useClass: RxDbExceptionLogRepository },

    // Facade
    StorageFacade,
  ],
})
export class StorageModule {}
```

**ประโยชน์:** เปลี่ยน implementation ได้ที่นี่ที่เดียว!

---

## 🔄 วิธีเปลี่ยน Database (ตัวอย่าง: RxDB → WatermelonDB)

### Step 1: สร้าง Implementation ใหม่

```typescript
// implementations/watermelon/watermelon.service.ts
@Injectable()
export class WatermelonDbService implements IDatabase {
  // Implement IDatabase methods using WatermelonDB
}

// implementations/watermelon/watermelon-transaction.repository.ts
@Injectable()
export class WatermelonTransactionRepository extends TransactionRepository {
  // Implement using WatermelonDB API
}
```

### Step 2: เปลี่ยน Provider ใน Module

```typescript
@NgModule({
  providers: [
    // แค่เปลี่ยนตรงนี้!
    WatermelonDbService,
    { provide: DATABASE_TOKEN, useExisting: WatermelonDbService },
    { provide: TransactionRepository, useClass: WatermelonTransactionRepository },
  ],
})
```

### Step 3: เสร็จแล้ว! 🎉

- ไม่ต้องแก้ Component
- ไม่ต้องแก้ Service
- ไม่ต้องแก้ Business Logic
- **Facade API ยังเหมือนเดิม**

---

## 💻 วิธีใช้งาน

### แบบเดิม (ซับซ้อน)

```typescript
export class MyComponent {
  constructor(private rxDb: RxDbService) {}

  async ngOnInit() {
    const db = this.rxDb.database;
    const docs = await db.txns.find({ selector: { "payload.status": "IN" } }).exec();
    const txns = docs.map((doc) => {
      const data = doc.toJSON();
      return {
        id: data.id,
        name: data.payload.user_name,
        status: data.payload.status,
      };
    });
  }
}
```

### แบบใหม่ (เรียบง่าย)

```typescript
export class MyComponent {
  constructor(private storage: StorageFacade) {}

  async ngOnInit() {
    const txns = await this.storage.getTransactionsByStatus("IN");
    // Done! Type-safe, clean API
  }
}
```

---

## 🎯 ประโยชน์ที่ได้

### ✅ 1. Loose Coupling (ผูกแน่นน้อย)

- Component ไม่รู้จัก RxDB
- เปลี่ยน DB ได้โดยไม่กระทบ business logic

### ✅ 2. Easy to Test

```typescript
// Mock StorageFacade ได้ง่าย
const storageMock = jasmine.createSpyObj("StorageFacade", ["getAllTransactions"]);
storageMock.getAllTransactions.and.returnValue(Promise.resolve([]));
```

### ✅ 3. Clean Domain Models

```typescript
// Type-safe, autocomplete ครบ
transaction.userName; // ✅ Not: transaction.payload.user_name
transaction.isSynced; // ✅ Not: transaction.payload.is_sync
```

### ✅ 4. Maintainable

- แต่ละ layer มีหน้าที่ชัดเจน
- เปลี่ยนแปลงที่ใดที่หนึ่งไม่กระทบส่วนอื่น

### ✅ 5. Scalable

- เพิ่ม entity ใหม่ได้ง่าย (แค่เพิ่ม model + repository + implementation)
- Support หลาย database พร้อมกันได้ (ถ้าต้องการ)

---

## 📚 เอกสารเพิ่มเติม

- **`USAGE_EXAMPLES.md`** - ตัวอย่างโค้ดการใช้งาน
- **`MIGRATION_GUIDE.md`** - วิธี migrate จากโค้ดเดิม
- **`README.md`** - รายละเอียดสถาปัตยกรรมเต็ม

---

## 🚀 สรุป

| เดิม                          | ใหม่                          |
| ----------------------------- | ----------------------------- |
| ผูกติดกับ RxDB                | ผูกกับ abstraction            |
| เปลี่ยน DB = refactor ทั้งหมด | เปลี่ยน DB = แก้ module เดียว |
| Test ยาก                      | Test ง่าย (mock facade)       |
| RxDB types ทุกที่             | Clean domain models           |
| Naming: snake_case            | Naming: camelCase             |

**คุณค่าหลัก:** _Future-proof architecture that adapts to change_ 🎯
