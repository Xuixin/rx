import { Database } from 'bun:sqlite';

// Create database
export const db = new Database('test.db', { create: true });

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Create tables immediately
// Transactions table
db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('IN', 'OUT', 'PENDING')),
    subject TEXT,
    organization TEXT,
    license_plate_number TEXT,
    phone_number TEXT,
    parking_door_number TEXT,
    entry_time TEXT,
    exit_time TEXT,
    files TEXT,
    is_synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Exception logs table
db.run(`
  CREATE TABLE IF NOT EXISTS exception_logs (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    service_name TEXT,
    error_type TEXT,
    code TEXT,
    timestamp TEXT,
    parking_door_number TEXT,
    is_synced INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

console.log('✅ Database tables created');

// Export init function for manual re-initialization
export function initDatabase() {
  console.log('✅ Database already initialized');
}

// Transaction CRUD
export const transactionQueries = {
  getAll: db.query('SELECT * FROM transactions ORDER BY created_at DESC'),
  getById: db.query('SELECT * FROM transactions WHERE id = $id'),
  getByStatus: db.query('SELECT * FROM transactions WHERE status = $status'),
  getUnsynced: db.query('SELECT * FROM transactions WHERE is_synced = 0'),
  insert: db.prepare(`
    INSERT INTO transactions (
      id, user_name, status, subject, organization, 
      license_plate_number, phone_number, parking_door_number,
      entry_time, exit_time, files, is_synced
    ) VALUES (
      $id, $user_name, $status, $subject, $organization,
      $license_plate_number, $phone_number, $parking_door_number,
      $entry_time, $exit_time, $files, $is_synced
    )
  `),
  update: db.prepare(`
    UPDATE transactions 
    SET status = $status, is_synced = $is_synced
    WHERE id = $id
  `),
  delete: db.prepare('DELETE FROM transactions WHERE id = $id'),
};

// Exception log CRUD
export const exceptionLogQueries = {
  getAll: db.query('SELECT * FROM exception_logs ORDER BY created_at DESC'),
  getById: db.query('SELECT * FROM exception_logs WHERE id = $id'),
  getByDoor: db.query(
    'SELECT * FROM exception_logs WHERE parking_door_number = $parking_door_number'
  ),
  getUnsynced: db.query('SELECT * FROM exception_logs WHERE is_synced = 0'),
  insert: db.prepare(`
    INSERT INTO exception_logs (
      id, message, service_name, error_type, code,
      timestamp, parking_door_number, is_synced
    ) VALUES (
      $id, $message, $service_name, $error_type, $code,
      $timestamp, $parking_door_number, $is_synced
    )
  `),
  update: db.prepare(`
    UPDATE exception_logs 
    SET is_synced = $is_synced
    WHERE id = $id
  `),
  delete: db.prepare('DELETE FROM exception_logs WHERE id = $id'),
};

// Utility functions
export function mapTransaction(row: any) {
  return {
    id: row.id,
    userName: row.user_name,
    status: row.status,
    subject: row.subject ? JSON.parse(row.subject) : [],
    organization: row.organization ? JSON.parse(row.organization) : [],
    licensePlateNumber: row.license_plate_number,
    phoneNumber: row.phone_number,
    parkingDoorNumber: row.parking_door_number,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    files: row.files ? JSON.parse(row.files) : [],
    isSynced: row.is_synced === 1,
    createdAt: row.created_at,
  };
}

export function mapExceptionLog(row: any) {
  return {
    id: row.id,
    message: row.message,
    serviceName: row.service_name,
    errorType: row.error_type,
    code: row.code,
    timestamp: row.timestamp,
    parkingDoorNumber: row.parking_door_number,
    isSynced: row.is_synced === 1,
    createdAt: row.created_at,
  };
}
