/**
 * API Request/Response Models
 * These match the domain models but can be adapted for API needs
 */

// Transaction API Models
export interface TransactionRequest {
  id?: string;
  userName: string;
  status: 'IN' | 'OUT' | 'PENDING';
  subject?: string[];
  organization?: string[];
  licensePlateNumber: string;
  phoneNumber: string;
  parkingDoorNumber: string;
  entryTime: string;
  exitTime: string;
  files?: TransactionFileRequest[];
  isSynced?: boolean;
}

export interface TransactionFileRequest {
  fileCategory: string;
  fileBase64?: string;
}

export interface TransactionResponse {
  id: string;
  userName: string;
  status: 'IN' | 'OUT' | 'PENDING';
  subject: string[];
  organization: string[];
  licensePlateNumber: string;
  phoneNumber: string;
  parkingDoorNumber: string;
  entryTime: string;
  exitTime: string;
  files: TransactionFileRequest[];
  isSynced: boolean;
  createdAt?: number;
}

export interface TransactionUpdateRequest {
  status?: 'IN' | 'OUT' | 'PENDING';
  isSynced?: boolean;
}

// Exception Log API Models
export interface ExceptionLogRequest {
  id?: string;
  message: string;
  serviceName: string;
  errorType: string;
  code: string;
  timestamp: string;
  parkingDoorNumber: string;
  isSynced?: boolean;
}

export interface ExceptionLogResponse {
  id: string;
  message: string;
  serviceName: string;
  errorType: string;
  code: string;
  timestamp: string;
  parkingDoorNumber: string;
  isSynced: boolean;
  createdAt?: number;
}

export interface ExceptionLogUpdateRequest {
  isSynced?: boolean;
}

// Common API Models
export interface CreateResponse {
  message: string;
  id: string;
}

export interface UpdateResponse {
  message: string;
  id: string;
}

export interface DeleteResponse {
  message: string;
  id: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
}
