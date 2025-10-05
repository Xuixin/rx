# Core Module - Architecture Guide

## 🎯 Overview

The Core module provides **abstracted, loosely-coupled infrastructure layers** that can be easily swapped without affecting business logic. This follows **Clean Architecture** principles.

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
│          (Components, Pages, Services)                      │
└────────────────────┬────────────────────────────────────────┘
                     │ Uses
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                    StorageFacade                            │
│              (Single API, hides complexity)                 │
└─────────┬──────────────────────────┬────────────────────────┘
          │                          │
          ↓                          ↓
┌──────────────────┐      ┌──────────────────────┐
│  IDatabase       │      │  IRepository<T>      │
│  (Abstract)      │      │  (Abstract)          │
└────────┬─────────┘      └──────────┬───────────┘
         │                           │
         │                           │
         ↓                           ↓
┌──────────────────┐      ┌──────────────────────┐
│  RxDbService     │      │  RxDbTransaction     │
│  (Concrete)      │      │  Repository          │
└──────────────────┘      │  (Concrete)          │
                          └──────────────────────┘
```

**Key Principle:** _Application depends on abstractions, NOT implementations_

## 📁 Structure

```
core/
├── storage/                          # Storage abstraction layer
│   ├── interfaces/                   # Contracts & abstractions
│   │   └── database.interface.ts     # IDatabase, IRepository interfaces
│   ├── models/                       # Domain models (DB-agnostic)
│   │   ├── transaction.model.ts
│   │   └── exception-log.model.ts
│   ├── repositories/                 # Abstract repositories
│   │   ├── transaction.repository.ts
│   │   └── exception-log.repository.ts
│   ├── implementations/              # Concrete implementations
│   │   └── rxdb/                     # RxDB implementation
│   │       ├── rxdb.service.ts
│   │       ├── rxdb-transaction.repository.ts
│   │       └── rxdb-exception-log.repository.ts
│   ├── storage.facade.ts             # Main API (Facade Pattern)
│   ├── storage.module.ts             # Dependency Injection setup
│   ├── index.ts                      # Public API
│   ├── README.md                     # This file
│   ├── USAGE_EXAMPLES.md             # Code examples
│   └── MIGRATION_GUIDE.md            # Migration guide
└── api/                              # API abstraction (future)
```

## 🎯 Design Patterns Used

### 1. **Repository Pattern**

- Separates data access logic from business logic
- Each entity has its own repository (Transaction, ExceptionLog)
- Abstract classes define the contract

### 2. **Facade Pattern**

- `StorageFacade` provides a simple, unified API
- Hides complexity of repositories and database implementations
- Single point of entry for all storage operations

### 3. **Abstract Factory Pattern**

- `IDatabase` interface allows swapping database implementations
- Repositories are abstract classes that can be implemented differently
- Configured via Angular DI in `storage.module.ts`

## 🔄 How to Switch Database Implementation

**Example: Switching from RxDB to WatermelonDB**

1. **Create new implementation:**

```typescript
// implementations/watermelon/watermelon.service.ts
@Injectable()
export class WatermelonDbService implements IDatabase {
  // Implement IDatabase methods
}

// implementations/watermelon/watermelon-transaction.repository.ts
@Injectable()
export class WatermelonTransactionRepository extends TransactionRepository {
  // Implement TransactionRepository methods
}
```

2. **Update StorageModule providers:**

```typescript
@NgModule({
  providers: [
    WatermelonDbService,
    { provide: IDatabase, useExisting: WatermelonDbService },
    { provide: TransactionRepository, useClass: WatermelonTransactionRepository },
    // ...
  ]
})
```

3. **Done!** No other code needs to change. Components, services, and pages continue to use `StorageFacade` without modification.

## 💡 Usage Examples

### Basic Usage (Recommended)

```typescript
import { StorageFacade } from '@app/core/storage';

@Component({...})
export class MyComponent {
  constructor(private storage: StorageFacade) {}

  async ngOnInit() {
    // Initialize database
    await this.storage.initialize();

    // Create transaction
    const txn = await this.storage.createTransaction({
      id: 'txn-001',
      userName: 'John Doe',
      status: 'IN',
      // ... other fields
    });

    // Get all transactions
    const all = await this.storage.getAllTransactions();

    // Reactive query
    this.storage.watchAllTransactions().subscribe(txns => {
      console.log('Transactions updated:', txns);
    });
  }
}
```

### Advanced Usage (Direct Repository Access)

```typescript
import { TransactionRepository } from "@app/core/storage/repositories";

@Injectable()
export class TransactionService {
  constructor(private txnRepo: TransactionRepository) {}

  async findPendingTransactions() {
    return this.txnRepo.findByStatus("PENDING");
  }
}
```

## 🎨 Benefits of This Architecture

### ✅ **Loose Coupling**

- Business logic doesn't depend on specific database implementation
- Easy to mock repositories for testing

### ✅ **Maintainability**

- Clear separation of concerns
- Each layer has a single responsibility

### ✅ **Flexibility**

- Swap database implementations without touching business logic
- Support multiple databases simultaneously (if needed)

### ✅ **Testability**

- Mock `StorageFacade` for component tests
- Mock repositories for service tests
- Mock `IDatabase` for repository tests

### ✅ **Clean API**

- Domain-focused methods (e.g., `getUnsyncedTransactions()`)
- No RxDB-specific code in business logic
- Consistent naming conventions

## 🚀 Future Enhancements

1. **Add API abstraction layer** (`core/api/`)

   - Similar pattern for HTTP API calls
   - Abstract API client that can switch between Axios, Angular HttpClient, Fetch, etc.

2. **Add caching layer**

   - Decorator pattern for repository caching
   - Transparent to consumers

3. **Add migration support**

   - Abstract schema migrations
   - Version management

4. **Add offline sync**
   - Sync strategy abstraction
   - Conflict resolution policies

## 📚 Related Patterns

- **Unit of Work**: For transaction management across multiple repositories
- **Specification Pattern**: For complex query building
- **CQRS**: Separate read/write models if needed
