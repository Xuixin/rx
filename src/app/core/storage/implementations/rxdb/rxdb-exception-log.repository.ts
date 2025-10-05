import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { ExceptionLogRepository } from '../../repositories';
import { ExceptionLog } from '../../models';
import { RxDbService } from './rxdb.service';

/**
 * RxDB implementation of Exception Log Repository
 * This is the concrete implementation that can be swapped out
 */
@Injectable()
export class RxDbExceptionLogRepository extends ExceptionLogRepository {
  constructor(private rxDbService: RxDbService) {
    super();
  }

  async findById(id: string): Promise<ExceptionLog | null> {
    const db = this.rxDbService.database;
    const doc = await db.exception_logs.findOne({ selector: { id } }).exec();
    return doc ? this.mapToModel(doc.toJSON()) : null;
  }

  async findAll(): Promise<ExceptionLog[]> {
    const db = this.rxDbService.database;
    const docs = await db.exception_logs.find().exec();
    return docs.map((doc) => this.mapToModel(doc.toJSON()));
  }

  async find(query: Partial<ExceptionLog>): Promise<ExceptionLog[]> {
    const db = this.rxDbService.database;
    const selector = this.buildSelector(query);
    const docs = await db.exception_logs.find({ selector }).exec();
    return docs.map((doc) => this.mapToModel(doc.toJSON()));
  }

  async insert(doc: ExceptionLog): Promise<ExceptionLog> {
    const db = this.rxDbService.database;
    const rxDoc = await db.exception_logs.insert(this.mapToDocument(doc));
    return this.mapToModel(rxDoc.toJSON());
  }

  async bulkInsert(docs: ExceptionLog[]): Promise<ExceptionLog[]> {
    const db = this.rxDbService.database;
    const rxDocs = await db.exception_logs.bulkInsert(
      docs.map(this.mapToDocument)
    );
    return Object.values(rxDocs.success).map((doc) =>
      this.mapToModel(doc.toJSON())
    );
  }

  async update(id: string, doc: Partial<ExceptionLog>): Promise<ExceptionLog> {
    const db = this.rxDbService.database;
    const existingDoc = await db.exception_logs
      .findOne({ selector: { id } })
      .exec();
    if (!existingDoc) {
      throw new Error(`ExceptionLog with id ${id} not found`);
    }
    await existingDoc.patch(this.mapToDocument(doc as ExceptionLog));
    return this.mapToModel(existingDoc.toJSON());
  }

  async delete(id: string): Promise<boolean> {
    const db = this.rxDbService.database;
    const doc = await db.exception_logs.findOne({ selector: { id } }).exec();
    if (!doc) return false;
    await doc.remove();
    return true;
  }

  findAll$(): Observable<ExceptionLog[]> {
    return from(this.rxDbService.init()).pipe(
      switchMap(() => {
        const db = this.rxDbService.database;
        return db.exception_logs.find().$;
      }),
      map((docs) => docs.map((doc) => this.mapToModel(doc.toJSON())))
    );
  }

  findById$(id: string): Observable<ExceptionLog | null> {
    return from(this.rxDbService.init()).pipe(
      switchMap(() => {
        const db = this.rxDbService.database;
        return db.exception_logs.findOne({ selector: { id } }).$;
      }),
      map((doc) => (doc ? this.mapToModel(doc.toJSON()) : null))
    );
  }

  // Domain-specific methods
  async findByParkingDoor(doorNumber: string): Promise<ExceptionLog[]> {
    const db = this.rxDbService.database;
    const docs = await db.exception_logs
      .find({ selector: { 'payload.parking_door_number': doorNumber } })
      .exec();
    return docs.map((doc) => this.mapToModel(doc.toJSON()));
  }

  async findUnsynced(): Promise<ExceptionLog[]> {
    const db = this.rxDbService.database;
    const docs = await db.exception_logs
      .find({ selector: { 'payload.is_sync': false } })
      .exec();
    return docs.map((doc) => this.mapToModel(doc.toJSON()));
  }

  async markAsSynced(id: string): Promise<ExceptionLog> {
    return this.update(id, { isSynced: true } as ExceptionLog);
  }

  // Mapping functions
  private mapToModel(doc: any): ExceptionLog {
    return {
      id: doc.id,
      message: doc.payload.message,
      serviceName: doc.payload.service_name,
      errorType: doc.payload.error_type,
      code: doc.payload.code,
      timestamp: new Date(doc.payload.timestamp),
      parkingDoorNumber: doc.payload.parking_door_number,
      isSynced: doc.payload.is_sync,
    };
  }

  private mapToDocument(model: ExceptionLog): any {
    return {
      id: model.id,
      payload: {
        message: model.message,
        service_name: model.serviceName,
        error_type: model.errorType,
        code: model.code,
        timestamp: model.timestamp,
        parking_door_number: model.parkingDoorNumber,
        is_sync: model.isSynced,
      },
    };
  }

  private buildSelector(query: Partial<ExceptionLog>): any {
    const selector: any = {};
    if (query.parkingDoorNumber)
      selector['payload.parking_door_number'] = query.parkingDoorNumber;
    if (query.isSynced !== undefined)
      selector['payload.is_sync'] = query.isSynced;
    return selector;
  }
}
