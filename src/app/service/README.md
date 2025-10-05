# Service Layer - Architecture Guidelines

## 🎯 คำถามสำคัญ: **เมื่อไหร่ควรสร้าง Abstraction Layer?**

### ❌ **ไม่ควรสร้าง Abstraction** (Simple Services)

Services ในโฟลเดอร์นี้ (`service/`) **ไม่ต้องการ abstraction layer** เพราะ:

#### 1. **InternetService** ✅ Simple

- ใช้ Web API มาตรฐาน (`navigator.onLine`)
- ไม่มีทางเลือก implementation อื่น
- Logic ตรงไปตรงมา
- **ไม่เปลี่ยนแปลงบ่อย**

#### 2. **CameraService** ✅ Simple

- ใช้ MediaDevices API มาตรฐาน
- Cross-platform ด้วย Capacitor
- Focused responsibility
- **API เดียวที่ใช้ได้**

#### 3. **CanvasService** ✅ Simple

- Canvas API เป็น web standard
- Utility functions
- ไม่มี external dependency ที่จะเปลี่ยน
- **Pure utility, no state**

---

### ✅ **ควรสร้าง Abstraction** (Complex Infrastructure)

ดูตัวอย่างที่ `core/storage/` - **ควร**มี abstraction เพราะ:

#### 1. **StorageService** (RxDB) ✅ Complex

- มีทางเลือก DB หลายตัว (RxDB, WatermelonDB, PouchDB, IndexedDB)
- **Business-critical** - ต้องเตรียมพร้อมเปลี่ยน
- Complex schema และ migrations
- **มีโอกาสเปลี่ยนสูง**

#### 2. **ApiService** (HTTP) ✅ Complex

- อาจเปลี่ยนจาก REST → GraphQL
- อาจเปลี่ยน library (Axios → Fetch → Angular HttpClient)
- Authentication strategies
- **External dependency ที่อาจเปลี่ยน**

---

## 📊 Decision Matrix

| Criteria                      | Simple Service   | Complex Service          |
| ----------------------------- | ---------------- | ------------------------ |
| **Multiple implementations?** | ❌ No            | ✅ Yes (RxDB/Watermelon) |
| **Vendor lock-in risk?**      | ❌ No            | ✅ Yes (third-party)     |
| **Business critical?**        | ❌ No            | ✅ Yes (data layer)      |
| **Change frequency?**         | ❌ Rare          | ✅ Often                 |
| **External dependencies?**    | ❌ Standard APIs | ✅ Third-party libs      |
| **Need abstraction?**         | ❌ **NO**        | ✅ **YES**               |

---

## 🎨 Architecture Comparison

### Simple Service (No Abstraction)

```typescript
// ✅ Direct implementation - Clean & Simple
@Injectable({ providedIn: 'root' })
export class CameraService {
  async startCamera(video: HTMLVideoElement) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  }
}

// Usage in component
constructor(private camera: CameraService) {}
await this.camera.startCamera(videoEl);
```

**Pros:**

- ✅ Simple, readable
- ✅ Less code
- ✅ Direct access
- ✅ Easy to understand

**When to use:**

- Standard Web APIs
- No alternative implementations
- Focused, single responsibility

---

### Complex Service (With Abstraction)

```typescript
// ❌ Without Abstraction (BAD for complex services)
@Injectable()
export class MyComponent {
  constructor(private rxDb: RxDbService) {}

  async save() {
    const db = this.rxDb.database;
    await db.transactions.insert({ ... }); // ❌ Tightly coupled to RxDB
  }
}

// ✅ With Abstraction (GOOD for complex services)
@Injectable()
export class MyComponent {
  constructor(private storage: StorageFacade) {}

  async save() {
    await this.storage.createTransaction({ ... }); // ✅ Loosely coupled
  }
}
```

**Pros of Abstraction:**

- ✅ Loose coupling
- ✅ Easy to swap implementations
- ✅ Testable (mock facade)
- ✅ Future-proof

**When to use:**

- Complex infrastructure
- Multiple possible implementations
- Business-critical
- Likely to change

---

## 📝 Examples in This Project

### ✅ Correct: Simple Services (No Abstraction)

```typescript
// service/internet.service.ts
export class InternetService {
  private isOnline = signal(navigator.onLine);
  // Direct implementation - perfect!
}

// service/camera.service.ts
export class CameraService {
  async startCamera(video, facingMode) {
    const stream = await navigator.mediaDevices.getUserMedia(...);
    // Direct API usage - perfect!
  }
}

// service/canvas.service.ts
export class CanvasService {
  drawImage(canvas, image, x, y) {
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, x, y);
    // Pure utility - perfect!
  }
}
```

### ✅ Correct: Complex Services (With Abstraction)

```typescript
// core/storage/ - Has full abstraction layer
// ├── interfaces/      ← Abstractions
// ├── models/          ← Domain models
// ├── repositories/    ← Abstract repos
// ├── implementations/ ← Concrete (RxDB)
// └── storage.facade.ts ← Main API

// Why? Because:
// - Multiple DB options exist
// - Business critical
// - Complex migrations
// - Likely to change
```

---

## 🚀 Guidelines

### When building a new service, ask:

1. **"Can this logic change implementation?"**

   - No → Simple service
   - Yes → Consider abstraction

2. **"Is this a third-party dependency?"**

   - Standard API → Simple service
   - Third-party lib → Consider abstraction

3. **"How critical is this to business logic?"**

   - Utility/Helper → Simple service
   - Core infrastructure → Use abstraction

4. **"Would I need to mock this extensively?"**
   - Simple mock → Simple service
   - Complex mock → Consider abstraction

---

## 💡 Real-World Decision Examples

### ✅ Simple (No Abstraction)

| Service           | Why Simple?                                        |
| ----------------- | -------------------------------------------------- |
| `InternetService` | Standard navigator API, no alternatives            |
| `CameraService`   | MediaDevices API is standard, Capacitor-compatible |
| `CanvasService`   | Pure Canvas API utilities                          |
| `GeoLocation`     | Standard Geolocation API                           |
| `LocalStorage`    | Simple key-value, standard API                     |

### ✅ Complex (Need Abstraction)

| Service          | Why Complex?                              |
| ---------------- | ----------------------------------------- |
| `StorageService` | Multiple DBs: RxDB/Watermelon/Pouch       |
| `ApiService`     | May change: REST→GraphQL, Axios→Fetch     |
| `AuthService`    | Multiple strategies: JWT/OAuth/Firebase   |
| `SyncService`    | Complex business logic, multiple backends |
| `PaymentService` | Multiple providers: Stripe/PayPal/etc     |

---

## 🎯 Summary

### Services in `service/` folder:

- ✅ **Keep them simple**
- ✅ **Direct implementation**
- ✅ **Use Angular Signals for reactivity**
- ✅ **Good error handling**
- ❌ **No abstraction needed**

### Services in `core/` folder:

- ✅ **Complex infrastructure**
- ✅ **Full abstraction layer**
- ✅ **Repository + Facade pattern**
- ✅ **Swappable implementations**

---

## 📚 Related Documentation

- **`core/ARCHITECTURE_SUMMARY.md`** - Full abstraction layer example
- **`core/storage/README.md`** - Storage layer architecture
- **`core/storage/USAGE_EXAMPLES.md`** - How to use storage facade

---

## 🔑 Key Takeaway

> **"Not everything needs abstraction. Use it wisely when you need flexibility, not by default."**

**YAGNI Principle**: You Ain't Gonna Need It

- Don't over-engineer
- Add abstraction when you **need** it, not when you **might** need it
- Simple services should stay simple
