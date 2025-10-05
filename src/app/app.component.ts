import { Component, inject, OnInit } from '@angular/core';
import 'zone.js/plugins/zone-patch-rxjs';
import { CronService } from './service/cron.service';
import { StorageFacade } from './core/storage/storage.facade';
import { ApiFacade } from './core/api/api.facade';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  cronService = inject(CronService);
  storageFacade = inject(StorageFacade);
  apiFacade = inject(ApiFacade);

  public appPages = [
    { title: 'Inbox', url: '/folder/inbox', icon: 'mail' },
    { title: 'Outbox', url: '/folder/outbox', icon: 'paper-plane' },
    { title: 'Favorites', url: '/folder/favorites', icon: 'heart' },
    { title: 'Archived', url: '/folder/archived', icon: 'archive' },
    { title: 'Trash', url: '/folder/trash', icon: 'trash' },
    { title: 'Spam', url: '/folder/spam', icon: 'warning' },
    {
      title: '📦 Storage Viewer',
      url: '/storage-viewer',
      icon: 'file-tray-full',
    },
  ];
  public labels = ['Family', 'Friends', 'Notes', 'Work', 'Travel', 'Reminders'];
  constructor() {}

  ngOnInit() {
    // ตัวเลือกที่ 1: ทุก 30 วินาที (สำหรับ testing)
    this.cronService.addSecondsJob('checkSyncLog', 30, () => {
      console.log('checkSyncLog - running every 30 seconds');
      this.checkSyncLog();
    });

    // ตัวเลือกที่ 2: ทุก 5 นาที (แนะนำสำหรับ production)
    // this.cronService.addMinutesJob('checkSyncLog', 5, () => {
    //   console.log('checkSyncLog - running every 5 minutes');
    //   this.checkSyncLog();
    // });

    // ตัวเลือกที่ 3: ทุก 1 ชั่วโมง (สำหรับ background sync)
    // this.cronService.addHoursJob('checkSyncLog', 1, () => {
    //   console.log('checkSyncLog - running every 1 hour');
    //   this.checkSyncLog();
    // });
  }

  async checkSyncLog() {
    const logUnSynced = await this.storageFacade.getUnsyncedExceptionLogs();

    console.log(`🔄 Syncing ${logUnSynced.length} unsynced exception logs...`);

    if (logUnSynced.length === 0) return;

    // Helper function to safely convert to ISO string
    const toISOString = (timestamp: any): string => {
      try {
        if (!timestamp) return new Date().toISOString();

        if (timestamp instanceof Date) {
          return isNaN(timestamp.getTime())
            ? new Date().toISOString()
            : timestamp.toISOString();
        }

        const date = new Date(timestamp);
        return isNaN(date.getTime())
          ? new Date().toISOString()
          : date.toISOString();
      } catch (error) {
        console.warn('⚠️ Invalid timestamp, using current time:', timestamp);
        return new Date().toISOString();
      }
    };

    // Helper function to check if similar error already exists
    const hasSimilarError = async (
      errorType: string,
      code: string,
      serviceName: string
    ): Promise<boolean> => {
      const allLogs = await this.storageFacade.getUnsyncedExceptionLogs();
      return allLogs.some(
        (log) =>
          log.errorType === errorType &&
          log.code === code &&
          log.serviceName === serviceName
      );
    };

    for (const log of logUnSynced) {
      // Convert ExceptionLog to ExceptionLogRequest
      const logRequest = {
        id: log.id,
        message: log.message || 'Unknown error',
        serviceName: log.serviceName || 'UnknownService',
        errorType: log.errorType || 'Error',
        code: log.code || 'UNKNOWN',
        timestamp: toISOString(log.timestamp),
        parkingDoorNumber: log.parkingDoorNumber || 'N/A',
        isSynced: false,
      };

      console.log('📤 Sending log to API:', logRequest);

      this.apiFacade
        .createExceptionLog(logRequest)
        .pipe(
          tap((response) => {
            console.log('✅ Log synced successfully:', response);
            this.storageFacade.deleteExceptionLog(log.id);
          }),
          catchError(async (error) => {
            console.error('❌ Failed to sync log:', error);

            // Determine error type and code based on error
            const errorType = this.getErrorType(error);
            const errorCode = this.getErrorCode(errorType);
            const errorMessage = this.getErrorMessage(error, errorType);

            // Check if similar error already exists (same type, code, service)
            const similarExists = await hasSimilarError(
              errorType,
              errorCode,
              'AppComponent'
            );

            if (similarExists) {
              console.log(
                '⚠️ Similar error already logged, skipping duplicate:',
                errorType
              );
              return of(null);
            }

            // Create a new error log only if no similar error exists
            await this.storageFacade.createExceptionLog({
              id: `sync-error-${errorType.toLowerCase()}-${Date.now()}`,
              message: errorMessage,
              timestamp: new Date(),
              isSynced: false,
              serviceName: 'AppComponent',
              errorType: errorType,
              code: errorCode,
              parkingDoorNumber: log.parkingDoorNumber || 'N/A',
            });

            console.log('📝 New error log created:', errorType);
            return of(null);
          })
        )
        .subscribe();
    }
  }

  // Helper: Determine error type from error object
  private getErrorType(error: any): string {
    const errorMessage = error?.message?.toLowerCase() || '';

    if (
      !navigator.onLine ||
      errorMessage.includes('network') ||
      errorMessage.includes('failed to fetch')
    ) {
      return 'NetworkOfflineError';
    }
    if (errorMessage.includes('timeout')) {
      return 'TimeoutError';
    }
    if (errorMessage.includes('400') || errorMessage.includes('bad request')) {
      return 'BadRequestError';
    }
    if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
      return 'UnauthorizedError';
    }
    if (errorMessage.includes('403') || errorMessage.includes('forbidden')) {
      return 'ForbiddenError';
    }
    if (errorMessage.includes('404') || errorMessage.includes('not found')) {
      return 'NotFoundError';
    }
    if (
      errorMessage.includes('500') ||
      errorMessage.includes('internal server')
    ) {
      return 'ServerError';
    }
    return 'SyncError';
  }

  // Helper: Get error code based on error type
  private getErrorCode(errorType: string): string {
    const errorCodes: Record<string, string> = {
      NetworkOfflineError: 'SYNC_NET_001',
      TimeoutError: 'SYNC_TMO_001',
      BadRequestError: 'SYNC_REQ_400',
      UnauthorizedError: 'SYNC_AUT_401',
      ForbiddenError: 'SYNC_FOR_403',
      NotFoundError: 'SYNC_NTF_404',
      ServerError: 'SYNC_SRV_500',
      SyncError: 'SYNC_ERR_001',
    };
    return errorCodes[errorType] || 'SYNC_UNK_999';
  }

  // Helper: Get user-friendly error message
  private getErrorMessage(error: any, errorType: string): string {
    const messages: Record<string, string> = {
      NetworkOfflineError:
        'ไม่สามารถเชื่อมต่อเครือข่าย กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
      TimeoutError: 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง',
      BadRequestError: 'ข้อมูลที่ส่งไม่ถูกต้อง กรุณาตรวจสอบข้อมูล',
      UnauthorizedError: 'ไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่',
      ForbiddenError: 'ไม่อนุญาตให้เข้าถึง กรุณาติดต่อผู้ดูแลระบบ',
      NotFoundError: 'ไม่พบข้อมูลที่ต้องการ',
      ServerError: 'เซิร์ฟเวอร์เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง',
      SyncError: `การซิงค์ล้มเหลว: ${error?.message || 'Unknown error'}`,
    };
    return messages[errorType] || messages['SyncError'];
  }

  // 🧪 Test function - เพิ่ม exception log ตัวอย่าง
  async testAddLog() {
    const randomDoor = Math.floor(Math.random() * 100) + 1;
    const testLog = {
      id: `test-${Date.now()}-${randomDoor}`, // Generate unique ID
      message: `Test Exception Log - ${new Date().toLocaleTimeString()}`,
      timestamp: new Date(),
      isSynced: false,
      serviceName: 'AppComponent - Test',
      errorType: 'TestError',
      code: 'TEST_001',
      parkingDoorNumber: randomDoor.toString(), // Must be string
    };

    try {
      await this.storageFacade.createExceptionLog(testLog);
      console.log('✅ Test log created:', testLog);

      // แสดง logs ทั้งหมด
      const allLogs = await this.storageFacade.getUnsyncedExceptionLogs();
      console.log(`📊 Total unsynced logs: ${allLogs.length}`, allLogs);
    } catch (error) {
      console.error('❌ Failed to create test log:', error);
    }
  }
}
