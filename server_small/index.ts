import { Elysia, t } from 'elysia';
import { cors } from '@elysiajs/cors';
import {
  db,
  initDatabase,
  transactionQueries,
  exceptionLogQueries,
  mapTransaction,
  mapExceptionLog,
} from './db';

import swagger from '@elysiajs/swagger';

// Initialize database
initDatabase();

const app = new Elysia()
  // Enable CORS for Angular app
  .use(
    cors({
      origin: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    })
  )
  .use(swagger())

  // Health check
  .get('/', () => ({
    message: '🚀 API Server is running!',
    version: '1.0.0',
    endpoints: {
      transactions: '/api/transactions',
      exceptionLogs: '/api/exception-logs',
      health: '/health',
    },
  }))

  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: 'connected',
  }))

  // ============================================
  // Transaction Endpoints
  // ============================================

  // Get all transactions
  .get('/api/transactions', () => {
    const rows = transactionQueries.getAll.all();
    return {
      data: rows.map(mapTransaction),
      count: rows.length,
    };
  })

  // Get transaction by ID
  .get('/api/transactions/:id', ({ params: { id } }) => {
    const row = transactionQueries.getById.get({ id });
    if (!row) {
      return { error: 'Transaction not found', status: 404 };
    }
    return { data: mapTransaction(row) };
  })

  // Get transactions by status
  .get('/api/transactions/status/:status', ({ params: { status } }) => {
    const rows = transactionQueries.getByStatus.all({ status });
    return {
      data: rows.map(mapTransaction),
      count: rows.length,
    };
  })

  // Get unsynced transactions
  .get('/api/transactions/sync/pending', () => {
    const rows = transactionQueries.getUnsynced.all();
    return {
      data: rows.map(mapTransaction),
      count: rows.length,
    };
  })

  // Create transaction
  .post(
    '/api/transactions',
    ({ body }) => {
      try {
        transactionQueries.insert.run({
          id: body.id || `txn-${Date.now()}`,
          user_name: body.userName,
          status: body.status,
          subject: JSON.stringify(body.subject || []),
          organization: JSON.stringify(body.organization || []),
          license_plate_number: body.licensePlateNumber,
          phone_number: body.phoneNumber,
          parking_door_number: body.parkingDoorNumber,
          entry_time: body.entryTime,
          exit_time: body.exitTime,
          files: JSON.stringify(body.files || []),
          is_synced: body.isSynced ? 1 : 0,
        });

        return {
          message: 'Transaction created',
          id: body.id,
        };
      } catch (error: any) {
        return {
          error: error.message,
          status: 400,
        };
      }
    },
    {
      body: t.Object({
        id: t.Optional(t.String()),
        userName: t.String(),
        status: t.Union([
          t.Literal('IN'),
          t.Literal('OUT'),
          t.Literal('PENDING'),
        ]),
        subject: t.Optional(t.Array(t.String())),
        organization: t.Optional(t.Array(t.String())),
        licensePlateNumber: t.String(),
        phoneNumber: t.String(),
        parkingDoorNumber: t.String(),
        entryTime: t.String(),
        exitTime: t.String(),
        files: t.Optional(t.Array(t.Any())),
        isSynced: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update transaction
  .patch(
    '/api/transactions/:id',
    ({ params: { id }, body }) => {
      try {
        transactionQueries.update.run(
          id,
          body.status || 'PENDING',
          body.isSynced ? 1 : 0
        );

        return { message: 'Transaction updated', id };
      } catch (error: any) {
        return { error: error.message, status: 400 };
      }
    },
    {
      body: t.Object({
        status: t.Optional(
          t.Union([t.Literal('IN'), t.Literal('OUT'), t.Literal('PENDING')])
        ),
        isSynced: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete transaction
  .delete('/api/transactions/:id', ({ params: { id } }) => {
    try {
      transactionQueries.delete.run({ id });
      return { message: 'Transaction deleted', id };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  })

  // ============================================
  // Exception Log Endpoints
  // ============================================

  // Get all exception logs
  .get('/api/exception-logs', () => {
    const rows = exceptionLogQueries.getAll.all();
    return {
      data: rows.map(mapExceptionLog),
      count: rows.length,
    };
  })

  // Get exception log by ID
  .get('/api/exception-logs/:id', ({ params: { id } }) => {
    const row = exceptionLogQueries.getById.get({ id });
    if (!row) {
      return { error: 'Exception log not found', status: 404 };
    }
    return { data: mapExceptionLog(row) };
  })

  // Get exception logs by parking door
  .get('/api/exception-logs/door/:door', ({ params: { door } }) => {
    const rows = exceptionLogQueries.getByDoor.all({
      parking_door_number: door,
    });
    return {
      data: rows.map(mapExceptionLog),
      count: rows.length,
    };
  })

  // Get unsynced exception logs
  .get('/api/exception-logs/sync/pending', () => {
    const rows = exceptionLogQueries.getUnsynced.all();
    return {
      data: rows.map(mapExceptionLog),
      count: rows.length,
    };
  })

  // Create exception log
  .post(
    '/api/exception-logs',
    ({ body }) => {
      try {
        const logId = body.id || `log-${Date.now()}`;

        exceptionLogQueries.insert.run({
          $id: logId,
          $message: body.message,
          $service_name: body.serviceName,
          $error_type: body.errorType,
          $code: body.code,
          $timestamp: body.timestamp,
          $parking_door_number: body.parkingDoorNumber,
          $is_synced: body.isSynced ? 1 : 0,
        });

        return {
          message: 'Exception log created',
          id: logId,
        };
      } catch (error: any) {
        console.error('❌ Failed to create exception log:', error);
        return {
          error: error.message,
          status: 400,
        };
      }
    },
    {
      body: t.Object({
        id: t.Optional(t.String()),
        message: t.String(),
        serviceName: t.String(),
        errorType: t.String(),
        code: t.String(),
        timestamp: t.String(),
        parkingDoorNumber: t.String(),
        isSynced: t.Optional(t.Boolean()),
      }),
    }
  )

  // Update exception log (mark as synced)
  .patch(
    '/api/exception-logs/:id',
    ({ params: { id }, body }) => {
      try {
        exceptionLogQueries.update.run({
          id,
          is_synced: body.isSynced ? 1 : 0,
        });

        return { message: 'Exception log updated', id };
      } catch (error: any) {
        return { error: error.message, status: 400 };
      }
    },
    {
      body: t.Object({
        isSynced: t.Optional(t.Boolean()),
      }),
    }
  )

  // Delete exception log
  .delete('/api/exception-logs/:id', ({ params: { id } }) => {
    try {
      exceptionLogQueries.delete.run({ id });
      return { message: 'Exception log deleted', id };
    } catch (error: any) {
      return { error: error.message, status: 400 };
    }
  })

  // Start server
  .listen(3000);

console.log(`
🚀 Server is running!
📍 URL: ${app.server?.url}
📚 API Docs: http://localhost:3000
💾 Database: SQLite (test.db)
`);
