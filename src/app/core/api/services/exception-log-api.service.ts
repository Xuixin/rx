import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ExceptionLogRequest,
  ExceptionLogResponse,
  ExceptionLogUpdateRequest,
  CreateResponse,
  UpdateResponse,
  DeleteResponse,
} from '../models/api-models';

/**
 * Abstract Exception Log API Service
 * Defines the contract for exception log API operations
 */
@Injectable()
export abstract class ExceptionLogApiService {
  abstract getAll(): Observable<ExceptionLogResponse[]>;
  abstract getById(id: string): Observable<ExceptionLogResponse>;
  abstract getByParkingDoor(
    doorNumber: string
  ): Observable<ExceptionLogResponse[]>;
  abstract getUnsynced(): Observable<ExceptionLogResponse[]>;
  abstract create(log: ExceptionLogRequest): Observable<CreateResponse>;
  abstract update(
    id: string,
    updates: ExceptionLogUpdateRequest
  ): Observable<UpdateResponse>;
  abstract delete(id: string): Observable<DeleteResponse>;
}
