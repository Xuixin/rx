import { transactionQueries, exceptionLogQueries } from './db';

console.log('🌱 Seeding database...\n');

// Seed transactions
const sampleTransactions = [
  {
    id: 'txn-001',
    user_name: 'สมชาย ใจดี',
    status: 'IN',
    subject: JSON.stringify(['ติดต่อราชการ']),
    organization: JSON.stringify(['org-001']),
    license_plate_number: 'กก 1234',
    phone_number: '0812345678',
    parking_door_number: 'A1',
    entry_time: new Date().toISOString(),
    exit_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    files: JSON.stringify([]),
    is_synced: 0,
  },
  {
    id: 'txn-002',
    user_name: 'สมหญิง รักสะอาด',
    status: 'OUT',
    subject: JSON.stringify(['รับเอกสาร']),
    organization: JSON.stringify(['org-002']),
    license_plate_number: 'ขข 5678',
    phone_number: '0898765432',
    parking_door_number: 'B2',
    entry_time: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    exit_time: new Date().toISOString(),
    files: JSON.stringify([]),
    is_synced: 1,
  },
  {
    id: 'txn-003',
    user_name: 'นายทดสอบ ระบบดี',
    status: 'PENDING',
    subject: JSON.stringify(['ประชุม', 'ส่งเอกสาร']),
    organization: JSON.stringify(['org-001', 'org-003']),
    license_plate_number: 'คค 9999',
    phone_number: '0811111111',
    parking_door_number: 'A1',
    entry_time: new Date().toISOString(),
    exit_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    files: JSON.stringify([]),
    is_synced: 0,
  },
];

try {
  for (const txn of sampleTransactions) {
    transactionQueries.insert.run({
      $id: txn.id,
      $user_name: txn.user_name,
      $status: txn.status,
      $subject: txn.subject,
      $organization: txn.organization,
      $license_plate_number: txn.license_plate_number,
      $phone_number: txn.phone_number,
      $parking_door_number: txn.parking_door_number,
      $entry_time: txn.entry_time,
      $exit_time: txn.exit_time,
      $files: txn.files,
      $is_synced: txn.is_synced,
    });
    console.log(`✅ Created transaction: ${txn.id} - ${txn.user_name}`);
  }
} catch (error) {
  console.error('❌ Error seeding transactions:', error);
}

// Seed exception logs
const sampleLogs = [
  {
    id: 'log-001',
    message: 'Camera permission denied by user',
    service_name: 'CameraService',
    error_type: 'NotAllowedError',
    code: 'ERR_CAM_001',
    timestamp: new Date().toISOString(),
    parking_door_number: 'A1',
    is_synced: 0,
  },
  {
    id: 'log-002',
    message: 'Network timeout when syncing data',
    service_name: 'SyncService',
    error_type: 'TimeoutError',
    code: 'ERR_NET_001',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    parking_door_number: 'B2',
    is_synced: 1,
  },
  {
    id: 'log-003',
    message: 'Failed to read ID card',
    service_name: 'OCRService',
    error_type: 'RecognitionError',
    code: 'ERR_OCR_001',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    parking_door_number: 'A1',
    is_synced: 0,
  },
];

try {
  for (const log of sampleLogs) {
    exceptionLogQueries.insert.run({
      $id: log.id,
      $message: log.message,
      $service_name: log.service_name,
      $error_type: log.error_type,
      $code: log.code,
      $timestamp: log.timestamp,
      $parking_door_number: log.parking_door_number,
      $is_synced: log.is_synced,
    });
    console.log(`✅ Created log: ${log.id} - ${log.message}`);
  }
} catch (error) {
  console.error('❌ Error seeding logs:', error);
}

console.log('\n🎉 Seeding completed!');
console.log('\n📊 Summary:');
console.log(`  Transactions: ${sampleTransactions.length}`);
console.log(`  Exception Logs: ${sampleLogs.length}`);
console.log('\n🚀 Run "bun run dev" to start the server');
