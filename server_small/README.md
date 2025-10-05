# 🚀 Test API Server

Simple REST API server สำหรับทดสอบ Angular app

## 📦 Stack

- **Runtime:** Bun
- **Framework:** Elysia
- **Database:** SQLite (local file: `test.db`)
- **CORS:** Enabled for Angular development

## 🛠️ Setup

```bash
# Install dependencies
bun install

# Run in development (with hot reload)
bun run dev

# Run in production
bun run start
```

Server will start at: **http://localhost:3000**

## 📚 API Endpoints

### Health Check

```bash
GET /              # API info
GET /health        # Health status
```

### Transactions

```bash
GET    /api/transactions                    # Get all
GET    /api/transactions/:id                # Get by ID
GET    /api/transactions/status/:status     # Get by status (IN/OUT/PENDING)
GET    /api/transactions/sync/pending       # Get unsynced
POST   /api/transactions                    # Create
PATCH  /api/transactions/:id                # Update
DELETE /api/transactions/:id                # Delete
```

### Exception Logs

```bash
GET    /api/exception-logs                  # Get all
GET    /api/exception-logs/:id              # Get by ID
GET    /api/exception-logs/door/:door       # Get by parking door
GET    /api/exception-logs/sync/pending     # Get unsynced
POST   /api/exception-logs                  # Create
PATCH  /api/exception-logs/:id              # Update
DELETE /api/exception-logs/:id              # Delete
```

## 📝 Example Usage

### Create Transaction

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "userName": "สมชาย ใจดี",
    "status": "IN",
    "subject": ["ติดต่อราชการ"],
    "organization": ["org-001"],
    "licensePlateNumber": "กก 1234",
    "phoneNumber": "0812345678",
    "parkingDoorNumber": "A1",
    "entryTime": "2024-01-01T10:00:00Z",
    "exitTime": "2024-01-01T12:00:00Z",
    "isSynced": false
  }'
```

### Get All Transactions

```bash
curl http://localhost:3000/api/transactions
```

### Create Exception Log

```bash
curl -X POST http://localhost:3000/api/exception-logs \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Camera error",
    "serviceName": "CameraService",
    "errorType": "NotAllowedError",
    "code": "ERR_001",
    "timestamp": "2024-01-01T10:00:00Z",
    "parkingDoorNumber": "A1",
    "isSynced": false
  }'
```

## 💾 Database

- **Type:** SQLite
- **File:** `test.db` (created automatically)
- **Tables:**
  - `transactions` - ข้อมูล transaction
  - `exception_logs` - ข้อมูล error log

### Reset Database

```bash
# Delete database file
rm test.db

# Restart server (will recreate tables)
bun run dev
```

## 🔧 Files

```
server_small/
├── index.ts          # Main server file
├── db.ts             # Database setup & queries
├── package.json      # Dependencies
├── test.db           # SQLite database (auto-created)
└── README.md         # This file
```

## 🌐 CORS

CORS is enabled for all origins. In production, update to specific domains:

```typescript
cors({
  origin: ["http://localhost:8100"], // Your Angular app URL
  // ...
});
```

## 🧪 Testing

```bash
# Health check
curl http://localhost:3000/health

# Get all transactions
curl http://localhost:3000/api/transactions

# Get all logs
curl http://localhost:3000/api/exception-logs
```

## 📦 Features

- ✅ RESTful API
- ✅ SQLite database (no setup needed)
- ✅ CORS enabled
- ✅ Type-safe with TypeScript
- ✅ Hot reload in development
- ✅ Simple & fast (Bun + Elysia)
- ✅ camelCase ↔️ snake_case mapping
- ✅ JSON array support (subject, organization, files)

## 🚀 Connect from Angular

```typescript
// In Angular service
const API_URL = 'http://localhost:3000/api';

async createTransaction(data: Transaction) {
  const response = await fetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return response.json();
}
```

---

**Built with ❤️ using Bun + Elysia**
