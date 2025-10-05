import { Observable } from 'rxjs';

/**
 * Generic database interface - abstraction layer
 * This allows us to swap database implementations without changing business logic
 */
export interface IDatabase {
  /**
   * Initialize database connection
   */
  init(): Promise<void>;

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean;

  /**
   * Destroy database instance
   */
  destroy(): Promise<void>;
}

/**
 * Generic repository interface for CRUD operations
 */
export interface IRepository<T> {
  /**
   * Find document by ID
   */
  findById(id: string): Promise<T | null>;

  /**
   * Find all documents
   */
  findAll(): Promise<T[]>;

  /**
   * Find documents by query
   */
  find(query: Partial<T>): Promise<T[]>;

  /**
   * Insert a document
   */
  insert(doc: T): Promise<T>;

  /**
   * Bulk insert documents
   */
  bulkInsert(docs: T[]): Promise<T[]>;

  /**
   * Update a document
   */
  update(id: string, doc: Partial<T>): Promise<T>;

  /**
   * Delete a document
   */
  delete(id: string): Promise<boolean>;

  /**
   * Observable stream of all documents (reactive)
   */
  findAll$(): Observable<T[]>;

  /**
   * Observable stream of a single document by ID (reactive)
   */
  findById$(id: string): Observable<T | null>;
}

/**
 * Query options for advanced queries
 */
export interface QueryOptions {
  limit?: number;
  skip?: number;
  sort?: { [key: string]: 'asc' | 'desc' };
}
