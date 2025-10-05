import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TransactionRepository } from '../../repositories';
import { Transaction } from '../../models';
import { RxDbService } from './rxdb.service';

/**
 * RxDB implementation of Transaction Repository
 * This is the concrete implementation that can be swapped out
 */
@Injectable()
export class RxDbTransactionRepository extends TransactionRepository {
  constructor(private rxDbService: RxDbService) {
    super();
  }

  async findById(id: string): Promise<Transaction | null> {
    const db = this.rxDbService.database;
    const doc = await db.txns.findOne({ selector: { id } }).exec();
    return doc ? this.mapToModel(doc.toJSON()) : null;
  }

  async findAll(): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const docs = await db.txns.find().exec();
    return docs.map((doc: any) => this.mapToModel(doc.toJSON()));
  }

  async find(query: Partial<Transaction>): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const selector = this.buildSelector(query);
    const docs = await db.txns.find({ selector }).exec();
    return docs.map((doc: any) => this.mapToModel(doc.toJSON()));
  }

  async insert(doc: Transaction): Promise<Transaction> {
    const db = this.rxDbService.database;
    const rxDoc = await db.txns.insert(this.mapToDocument(doc));
    return this.mapToModel(rxDoc.toJSON());
  }

  async bulkInsert(docs: Transaction[]): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const rxDocs = await db.txns.bulkInsert(docs.map(this.mapToDocument));
    return Object.values(rxDocs.success).map((doc: any) =>
      this.mapToModel(doc.toJSON())
    );
  }

  async update(id: string, doc: Partial<Transaction>): Promise<Transaction> {
    const db = this.rxDbService.database;
    const existingDoc = await db.txns.findOne({ selector: { id } }).exec();
    if (!existingDoc) {
      throw new Error(`Transaction with id ${id} not found`);
    }
    await existingDoc.patch(this.mapToDocument(doc as Transaction));
    return this.mapToModel(existingDoc.toJSON());
  }

  async delete(id: string): Promise<boolean> {
    const db = this.rxDbService.database;
    const doc = await db.txns.findOne({ selector: { id } }).exec();
    if (!doc) return false;
    await doc.remove();
    return true;
  }

  findAll$(): Observable<Transaction[]> {
    return from(this.rxDbService.init()).pipe(
      switchMap(() => {
        const db = this.rxDbService.database;
        return db.txns.find().$;
      }),
      map((docs: any[]) =>
        docs.map((doc: any) => this.mapToModel(doc.toJSON()))
      )
    );
  }

  findById$(id: string): Observable<Transaction | null> {
    return from(this.rxDbService.init()).pipe(
      switchMap(() => {
        const db = this.rxDbService.database;
        return db.txns.findOne({ selector: { id } }).$;
      }),
      map((doc) => (doc ? this.mapToModel(doc.toJSON()) : null))
    );
  }

  // Domain-specific methods
  async findByStatus(status: 'IN' | 'OUT' | 'PENDING'): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const docs = await db.txns
      .find({ selector: { 'payload.status': status } })
      .exec();
    return docs.map((doc: any) => this.mapToModel(doc.toJSON()));
  }

  async findUnsynced(): Promise<Transaction[]> {
    const db = this.rxDbService.database;
    const docs = await db.txns
      .find({ selector: { 'payload.is_sync': false } })
      .exec();
    return docs.map((doc: any) => this.mapToModel(doc.toJSON()));
  }

  async markAsSynced(id: string): Promise<Transaction> {
    return this.update(id, { isSynced: true } as Transaction);
  }

  // Mapping functions to convert between domain models and RxDB documents
  private mapToModel(doc: any): Transaction {
    return {
      id: doc.id,
      userName: doc.payload.user_name,
      status: doc.payload.status,
      subject: doc.payload.subject,
      organization: doc.payload.organization,
      licensePlateNumber: doc.payload.license_plate_number,
      phoneNumber: doc.payload.phone_number,
      parkingDoorNumber: doc.payload.parking_door_number,
      entryTime: new Date(doc.payload.entry_time),
      exitTime: new Date(doc.payload.exit_time),
      files: doc.payload.file,
      isSynced: doc.payload.is_sync,
      createdAt: doc.createdAt,
    };
  }

  private mapToDocument(model: Transaction): any {
    return {
      id: model.id,
      payload: {
        user_name: model.userName,
        status: model.status,
        subject: model.subject,
        organization: model.organization,
        license_plate_number: model.licensePlateNumber,
        phone_number: model.phoneNumber,
        parking_door_number: model.parkingDoorNumber,
        entry_time: model.entryTime,
        exit_time: model.exitTime,
        file: model.files,
        is_sync: model.isSynced,
      },
      createdAt: model.createdAt || Date.now(),
    };
  }

  private buildSelector(query: Partial<Transaction>): any {
    const selector: any = {};
    if (query.status) selector['payload.status'] = query.status;
    if (query.isSynced !== undefined)
      selector['payload.is_sync'] = query.isSynced;
    return selector;
  }
}
