/**
 * Domain model - independent of database implementation
 */
export interface ExceptionLog {
  id: string;
  message: string;
  serviceName: string;
  errorType: string;
  code: string;
  timestamp: Date;
  parkingDoorNumber: string;
  isSynced: boolean;
}
