/**
 * Domain model - independent of database implementation
 */
export interface Transaction {
  id: string;
  userName: string;
  status: 'IN' | 'OUT' | 'PENDING';
  subject: string[];
  organization: string[];
  licensePlateNumber: string;
  phoneNumber: string;
  parkingDoorNumber: string;
  entryTime: Date;
  exitTime: Date;
  files?: TransactionFile[];
  isSynced: boolean;
  createdAt?: number;
}

export interface TransactionFile {
  fileCategory: string;
  fileBase64?: string;
}
