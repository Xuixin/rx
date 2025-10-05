# CronService Usage Guide

## 🎯 Browser-Compatible Job Scheduler

สำหรับ Angular/Browser (ไม่ใช้ Node.js cron package)

---

## 📦 Installation

ไม่ต้องติดตั้ง package เพิ่ม! ใช้ได้เลย:

```typescript
import { CronService } from './service/cron.service';

constructor(private cronService: CronService) {}
```

---

## 🚀 Basic Usage

### 1. Interval Jobs (ทำงานทุกๆ n มิลลิวินาที)

```typescript
// ทำงานทุก 5 วินาที
this.cronService.addSecondsJob("my-task", 5, async () => {
  console.log("Running every 5 seconds");
});

// ทำงานทุก 10 นาที
this.cronService.addMinutesJob("sync-data", 10, async () => {
  await this.syncService.syncAllPending();
});

// ทำงานทุก 1 ชั่วโมง
this.cronService.addHoursJob("cleanup", 1, async () => {
  await this.cleanupOldLogs();
});
```

### 2. Custom Interval (มิลลิวินาที)

```typescript
// ทุก 30 วินาที
this.cronService.addIntervalJob("heartbeat", 30000, async () => {
  console.log("Heartbeat");
});
```

### 3. Daily Jobs (ทำงานทุกวันเวลาที่กำหนด)

```typescript
// ทำงานทุกวันเวลา 00:00 (เที่ยงคืน)
this.cronService.addDailyJob("midnight-sync", 0, 0, async () => {
  await this.syncService.syncAllPending();
});

// ทำงานทุกวันเวลา 09:00 (เช้า)
this.cronService.addDailyJob("morning-report", 9, 0, async () => {
  await this.generateReport();
});

// ทำงานทุกวันเวลา 18:30 (เย็น)
this.cronService.addDailyJob("evening-backup", 18, 30, async () => {
  await this.backupData();
});
```

---

## ⚙️ Options

```typescript
interface CronJobOptions {
  autoStart?: boolean; // เริ่มอัตโนมัติ (default: true)
  runOnInit?: boolean; // รันทันทีพอสร้าง (default: false)
  maxRuns?: number; // จำกัดจำนวนครั้ง (default: unlimited)
  onError?: (error: any) => void; // Error callback
}
```

### ตัวอย่างการใช้ Options:

```typescript
// ไม่เริ่มอัตโนมัติ
this.cronService.addMinutesJob(
  "manual-sync",
  5,
  async () => {
    await this.sync();
  },
  { autoStart: false }
);

// รันทันที + ทุก 10 นาที
this.cronService.addMinutesJob(
  "init-sync",
  10,
  async () => {
    await this.sync();
  },
  { runOnInit: true }
);

// จำกัด 10 ครั้ง
this.cronService.addSecondsJob(
  "limited-task",
  5,
  async () => {
    console.log("Limited run");
  },
  { maxRuns: 10 }
);

// Error handling
this.cronService.addMinutesJob(
  "error-task",
  5,
  async () => {
    throw new Error("Something went wrong");
  },
  {
    onError: (error) => {
      console.error("Job failed:", error);
      this.logError(error);
    },
  }
);
```

---

## 🎛️ Job Management

### Start/Stop Jobs

```typescript
// Start job (ถ้า autoStart: false)
this.cronService.startJob("my-task");

// Stop job
this.cronService.stopJob("my-task");

// Stop all jobs
this.cronService.stopAll();
```

### Remove Jobs

```typescript
// Remove specific job
this.cronService.removeJob("my-task");

// Remove all jobs
this.cronService.removeAll();
```

### Get Job Info

```typescript
// Get specific job
const job = this.cronService.getJob("my-task");
if (job) {
  console.log(`Running: ${job.isRunning}`);
  console.log(`Run count: ${job.runCount}`);
  console.log(`Last run: ${job.lastRun}`);
  console.log(`Next run: ${job.nextRun}`);
}

// Get all jobs
const allJobs = this.cronService.getAllJobs();
console.log(`Total jobs: ${allJobs.length}`);

// Get running jobs count
const runningCount = this.cronService.getRunningJobsCount();
console.log(`Running: ${runningCount}`);

// Get next run time
const nextRun = this.cronService.getNextRunTime("my-task");
console.log(`Next run: ${nextRun}`);
```

---

## 💡 Real-World Examples

### Example 1: Auto Sync Service

```typescript
import { Injectable, OnDestroy } from "@angular/core";
import { CronService } from "./cron.service";
import { SyncService } from "./sync.service";
import { InternetService } from "./internet.service";

@Injectable({
  providedIn: "root",
})
export class AutoSyncService implements OnDestroy {
  constructor(private cronService: CronService, private syncService: SyncService, private internet: InternetService) {
    this.setupSyncJobs();
  }

  private setupSyncJobs() {
    // Sync ทุก 5 นาที (ถ้า online)
    this.cronService.addMinutesJob(
      "auto-sync",
      5,
      async () => {
        if (this.internet.isConnected()) {
          await this.syncService.syncAllPending();
        }
      },
      { runOnInit: true }
    );

    // Cleanup logs ทุกวันเที่ยงคืน
    this.cronService.addDailyJob("cleanup-logs", 0, 0, async () => {
      await this.cleanupOldLogs();
    });

    // Heartbeat ทุก 30 วินาที
    this.cronService.addSecondsJob("heartbeat", 30, async () => {
      console.log("❤️ Heartbeat", new Date());
    });
  }

  private async cleanupOldLogs() {
    // Delete logs older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    // ... cleanup logic
  }

  ngOnDestroy() {
    this.cronService.removeJob("auto-sync");
    this.cronService.removeJob("cleanup-logs");
    this.cronService.removeJob("heartbeat");
  }
}
```

### Example 2: Component with Cron Jobs

```typescript
import { Component, OnInit, OnDestroy } from "@angular/core";
import { CronService } from "../service/cron.service";

@Component({
  selector: "app-dashboard",
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-card>
        <ion-card-header>
          <ion-card-title>Cron Jobs Status</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <p>Running Jobs: {{ runningJobs }}</p>
          <p>Total Jobs: {{ totalJobs }}</p>

          <ion-list>
            <ion-item *ngFor="let job of jobs">
              <ion-label>
                <h3>{{ job.name }}</h3>
                <p>Status: {{ job.isRunning ? "Running" : "Stopped" }}</p>
                <p>Run count: {{ job.runCount }}</p>
                <p>Next run: {{ job.nextRun | date : "short" }}</p>
              </ion-label>
              <ion-button slot="end" (click)="toggleJob(job.name)">
                {{ job.isRunning ? "Stop" : "Start" }}
              </ion-button>
            </ion-item>
          </ion-list>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `,
})
export class DashboardPage implements OnInit, OnDestroy {
  jobs: any[] = [];
  runningJobs = 0;
  totalJobs = 0;

  constructor(private cronService: CronService) {}

  ngOnInit() {
    // Setup jobs
    this.cronService.addSecondsJob("counter", 5, async () => {
      console.log("Counter tick");
    });

    this.cronService.addMinutesJob("refresh", 1, async () => {
      await this.refreshData();
    });

    // Update UI every second
    setInterval(() => {
      this.updateUI();
    }, 1000);
  }

  updateUI() {
    this.jobs = this.cronService.getAllJobs();
    this.runningJobs = this.cronService.getRunningJobsCount();
    this.totalJobs = this.jobs.length;
  }

  toggleJob(name: string) {
    const job = this.cronService.getJob(name);
    if (job?.isRunning) {
      this.cronService.stopJob(name);
    } else {
      this.cronService.startJob(name);
    }
  }

  async refreshData() {
    console.log("Refreshing data...");
    // ... refresh logic
  }

  ngOnDestroy() {
    this.cronService.stopAll();
  }
}
```

### Example 3: Background Data Sync

```typescript
@Injectable({ providedIn: "root" })
export class BackgroundSyncService {
  constructor(private cronService: CronService, private storage: StorageFacade, private api: ApiFacade, private internet: InternetService) {
    this.setupBackgroundSync();
  }

  private setupBackgroundSync() {
    // Quick sync ทุก 2 นาที
    this.cronService.addMinutesJob(
      "quick-sync",
      2,
      async () => {
        await this.quickSync();
      },
      { runOnInit: true }
    );

    // Full sync ทุก 30 นาที
    this.cronService.addMinutesJob("full-sync", 30, async () => {
      await this.fullSync();
    });

    // Retry failed syncs ทุก 5 นาที
    this.cronService.addMinutesJob("retry-failed", 5, async () => {
      await this.retryFailedSyncs();
    });
  }

  private async quickSync() {
    if (!this.internet.isConnected()) return;

    const unsynced = await this.storage.getUnsyncedTransactions();
    if (unsynced.length === 0) return;

    console.log(`📤 Quick sync: ${unsynced.length} items`);

    for (const txn of unsynced.slice(0, 10)) {
      // Sync max 10 items
      try {
        await this.api.createTransaction(txn).toPromise();
        await this.storage.syncTransaction(txn.id);
      } catch (error) {
        console.error("Sync failed:", error);
      }
    }
  }

  private async fullSync() {
    if (!this.internet.isConnected()) return;

    console.log("📤 Full sync started");
    const unsynced = await this.storage.getUnsyncedTransactions();
    // ... full sync logic
  }

  private async retryFailedSyncs() {
    // Retry logic
  }
}
```

---

## 🔧 Helper Functions (Time Calculations)

```typescript
// Convert to milliseconds
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Examples:
this.cronService.addIntervalJob("every-30s", 30 * SECOND, callback);
this.cronService.addIntervalJob("every-2m", 2 * MINUTE, callback);
this.cronService.addIntervalJob("every-6h", 6 * HOUR, callback);
```

---

## ⚠️ Important Notes

### 1. Browser Limitations

- Jobs จะหยุดเมื่อปิดแอพ/รีโหลดหน้า
- ไม่รองรับ background execution เมื่อแอพไม่ active
- สำหรับ production ควรใช้ร่วมกับ Service Worker

### 2. Memory Management

- ต้อง cleanup jobs ใน `ngOnDestroy()`
- ใช้ `stopAll()` หรือ `removeAll()` เมื่อไม่ใช้แล้ว

```typescript
ngOnDestroy() {
  this.cronService.stopAll();
  // หรือ
  this.cronService.removeAll();
}
```

### 3. Precision

- `setInterval` ไม่แม่นยำ 100%
- อาจเลื่อนได้ ±100ms
- ไม่เหมาะกับ timing-critical tasks

### 4. Daily Jobs

- Daily jobs ใช้ `setTimeout` แทน `setInterval`
- Schedule ใหม่ทุกครั้งหลังรัน
- เวลา based on client timezone

---

## 🎓 Best Practices

1. **ใช้ชื่อ job ที่ชัดเจน**

   ```typescript
   ❌ this.cronService.addMinutesJob('job1', 5, callback);
   ✅ this.cronService.addMinutesJob('sync-transactions', 5, callback);
   ```

2. **Cleanup ใน ngOnDestroy**

   ```typescript
   ngOnDestroy() {
     this.cronService.removeJob('my-job');
   }
   ```

3. **Check connectivity ก่อน sync**

   ```typescript
   if (this.internet.isConnected()) {
     await this.sync();
   }
   ```

4. **Error handling**

   ```typescript
   {
     onError: (error) => {
       this.logError(error);
       this.notifyUser();
     };
   }
   ```

5. **จำกัดจำนวนครั้ง**
   ```typescript
   {
     maxRuns: 100;
   } // Auto stop after 100 runs
   ```

---

## 📊 Comparison: Node.js Cron vs Browser CronService

| Feature                | Node.js `cron`           | Browser CronService     |
| ---------------------- | ------------------------ | ----------------------- |
| Cron expressions       | ✅ Yes                   | ❌ No                   |
| Simple intervals       | ❌ Workaround            | ✅ Yes                  |
| Daily scheduling       | ✅ Yes                   | ✅ Yes                  |
| Background execution   | ✅ Yes                   | ❌ Only when app active |
| Browser compatibility  | ❌ No (needs child_proc) | ✅ Yes                  |
| Dependencies           | `cron` package           | None                    |
| Memory usage           | Medium                   | Low                     |
| Timezone support       | ✅ Yes                   | Client timezone         |
| Persistent across runs | ✅ Yes                   | ❌ No                   |

---

## 🚀 Migration from Node.js Cron

### Before (Node.js):

```typescript
import { CronJob } from "cron";

const job = new CronJob("*/5 * * * *", async () => {
  await sync();
});
job.start();
```

### After (Browser):

```typescript
this.cronService.addMinutesJob("sync", 5, async () => {
  await sync();
});
```

---

## 🆘 Troubleshooting

### Job ไม่ทำงาน

```typescript
// Check if job exists
const job = this.cronService.getJob("my-job");
console.log(job);

// Check if running
console.log("Running:", job?.isRunning);

// Try starting manually
this.cronService.startJob("my-job");
```

### Job ทำงานซ้ำ

```typescript
// Remove old job before adding new one
this.cronService.removeJob("my-job");
this.cronService.addMinutesJob("my-job", 5, callback);
```

### Memory leaks

```typescript
// Always cleanup in ngOnDestroy
ngOnDestroy() {
  this.cronService.removeAll();
}
```

---

ต้องการความช่วยเหลือเพิ่มเติม? สามารถดู source code ใน `cron.service.ts` ได้เลยครับ! 🎉
