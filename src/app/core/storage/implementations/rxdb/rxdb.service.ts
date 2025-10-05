import { Injectable } from '@angular/core';
import { createRxDatabase, RxCollection, RxDatabase, addRxPlugin } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBMigrationSchemaPlugin } from 'rxdb/plugins/migration-schema';
import { IDatabase } from '../../interfaces/database.interface';

// Add required RxDB plugins
addRxPlugin(RxDBMigrationSchemaPlugin);

// RxDB-specific schemas (internal implementation detail)
const txnSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  title: 'Txn',
  description: 'Txn',
  properties: {
    id: { type: 'string', maxLength: 255 },
    payload: { type: 'object' },
    createdAt: { type: 'number' },
  },
  required: ['id', 'payload'],
};

const exceptionLogSchema = {
  version: 1,
  primaryKey: 'id',
  type: 'object',
  title: 'ExceptionLog',
  description: 'ExceptionLog',
  properties: {
    id: { type: 'string', maxLength: 255 },
    payload: { type: 'object' },
  },
  required: ['id', 'payload'],
};

// RxDB-specific types (internal)
interface TxnDocument {
  id: string;
  payload: any;
  createdAt?: number;
}

interface ExceptionLogDocument {
  id: string;
  payload: any;
}

interface MyDatabaseCollections {
  txns: RxCollection<TxnDocument>;
  exception_logs: RxCollection<ExceptionLogDocument>;
}

type MyDatabase = RxDatabase<MyDatabaseCollections>;

/**
 * RxDB-specific database service
 * This implementation can be replaced with other database implementations
 * without affecting the rest of the application
 */
@Injectable()
export class RxDbService implements IDatabase {
  private rxdb!: MyDatabase;
  private initPromise?: Promise<void>;

  async init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (this.rxdb) {
      return;
    }

    this.initPromise = this.createDatabase();
    await this.initPromise;
  }

  private async createDatabase(): Promise<void> {
    try {
      const db = await createRxDatabase<MyDatabaseCollections>({
        name: 'workflow-v2',
        storage: getRxStorageDexie(),
      });

      await db.addCollections({
        txns: { schema: txnSchema },
        exception_logs: { schema: exceptionLogSchema },
      });

      this.rxdb = db;
      console.log('✅ RxDB initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RxDB:', error);
      this.initPromise = undefined;
      throw error;
    }
  }

  get database(): MyDatabase {
    if (!this.rxdb) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.rxdb;
  }

  isInitialized(): boolean {
    return !!this.rxdb;
  }

  async destroy(): Promise<void> {
    if (this.rxdb) {
      for (const collectionName of Object.keys(this.rxdb.collections)) {
        await (this.rxdb.collections as Record<string, any>)[
          collectionName
        ].remove();
      }
      await this.rxdb.remove();
      this.rxdb = undefined as any;
      this.initPromise = undefined;
    }
  }
}
