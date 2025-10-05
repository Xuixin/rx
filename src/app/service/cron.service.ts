import { Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

interface CronJobOptions {
  autoStart?: boolean;
  runOnInit?: boolean;
  maxRuns?: number;
  onError?: (error: any) => void;
}

interface CronJobWrapper {
  name: string;
  intervalId: any;
  interval: number;
  runCount: number;
  lastRun: Date | null;
  nextRun: Date | null;
  isRunning: boolean;
  onTick: () => void | Promise<void>;
  options: CronJobOptions;
}

interface CronJobInfo {
  name: string;
  interval: number;
  isRunning: boolean;
  runCount: number;
  lastRun: Date | null;
  nextRun: Date | null;
}

/**
 * CronService - Browser-compatible interval-based job scheduler
 *
 * สำหรับ Angular/Browser (ไม่ใช้ Node.js cron package)
 *
 * ตัวอย่างการใช้งาน:
 * - ทุกชั่วโมง: 60 * 60 * 1000 (3600000 ms)
 * - ทุกวันเวลาเที่ยงคืน: scheduleDaily(0, 0, callback)
 * - ทุก 5 นาที: 5 * 60 * 1000 (300000 ms)
 * - ทุกนาที: 60 * 1000 (60000 ms)
 * - ทุก 30 วินาที: 30 * 1000 (30000 ms)
 */
@Injectable({
  providedIn: 'root',
})
export class CronService implements OnDestroy {
  private jobs: Map<string, CronJobWrapper> = new Map();
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnDestroy(): void {
    this.stopAll();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * เพิ่ม interval job (ทุกๆ n มิลลิวินาที)
   */
  addIntervalJob(
    name: string,
    interval: number,
    onTick: () => void | Promise<void>,
    options?: CronJobOptions
  ): void {
    if (this.jobs.has(name)) {
      console.warn(`Job "${name}" already exists. Removing old job.`);
      this.removeJob(name);
    }

    let runCount = 0;
    const maxRuns = options?.maxRuns;

    const wrappedOnTick = async () => {
      if (maxRuns && runCount >= maxRuns) {
        console.log(`Job "${name}" reached max runs (${maxRuns})`);
        this.stopJob(name);
        return;
      }

      try {
        await onTick();
        runCount++;

        const job = this.jobs.get(name);
        if (job) {
          job.runCount = runCount;
          job.lastRun = new Date();
          job.nextRun = new Date(Date.now() + interval);
        }

        console.log(`Job "${name}" executed successfully (run #${runCount})`);
      } catch (error) {
        console.error(`Error executing job "${name}":`, error);

        if (options?.onError) {
          options.onError(error);
        }
      }
    };

    const wrapper: CronJobWrapper = {
      name,
      intervalId: null,
      interval,
      runCount: 0,
      lastRun: null,
      nextRun: null,
      isRunning: false,
      onTick: wrappedOnTick,
      options: options || {},
    };

    this.jobs.set(name, wrapper);

    if (options?.runOnInit) {
      wrappedOnTick();
    }

    if (options?.autoStart !== false) {
      this.startJob(name);
    }

    console.log(`Job "${name}" added with interval: ${interval}ms`);
  }

  /**
   * Schedule job ที่ทำงานทุกวันเวลาที่กำหนด (เช่น 00:00, 09:00)
   */
  addDailyJob(
    name: string,
    hour: number,
    minute: number,
    onTick: () => void | Promise<void>,
    options?: CronJobOptions
  ): void {
    const getNextRun = () => {
      const now = new Date();
      const scheduled = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0,
        0
      );

      // ถ้าเวลาที่กำหนดผ่านไปแล้ววันนี้ ให้เลื่อนไปวันพรุ่งนี้
      if (scheduled.getTime() <= now.getTime()) {
        scheduled.setDate(scheduled.getDate() + 1);
      }

      return scheduled;
    };

    const scheduleNext = () => {
      const nextRun = getNextRun();
      const delay = nextRun.getTime() - Date.now();

      const wrapper = this.jobs.get(name);
      if (wrapper) {
        wrapper.nextRun = nextRun;
        wrapper.intervalId = setTimeout(async () => {
          await onTick();
          const job = this.jobs.get(name);
          if (job) {
            job.runCount++;
            job.lastRun = new Date();
          }
          scheduleNext(); // Schedule next day
        }, delay);
        wrapper.isRunning = true;
      }
    };

    const wrapper: CronJobWrapper = {
      name,
      intervalId: null,
      interval: 24 * 60 * 60 * 1000, // 24 hours
      runCount: 0,
      lastRun: null,
      nextRun: getNextRun(),
      isRunning: false,
      onTick: scheduleNext,
      options: options || {},
    };

    this.jobs.set(name, wrapper);

    if (options?.autoStart !== false) {
      scheduleNext();
    }

    console.log(
      `Daily job "${name}" added for ${hour
        .toString()
        .padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    );
  }

  /**
   * เริ่มทำงาน job
   */
  startJob(name: string): void {
    const wrapper = this.jobs.get(name);
    if (!wrapper) {
      console.error(`Job "${name}" not found`);
      return;
    }

    if (wrapper.isRunning) {
      console.warn(`Job "${name}" is already running`);
      return;
    }

    wrapper.intervalId = setInterval(wrapper.onTick, wrapper.interval);
    wrapper.isRunning = true;
    wrapper.nextRun = new Date(Date.now() + wrapper.interval);

    console.log(`Job "${name}" started`);
  }

  /**
   * หยุดทำงาน job
   */
  stopJob(name: string): void {
    const wrapper = this.jobs.get(name);
    if (!wrapper) {
      console.error(`Job "${name}" not found`);
      return;
    }

    if (!wrapper.isRunning) {
      console.warn(`Job "${name}" is not running`);
      return;
    }

    if (wrapper.intervalId) {
      clearInterval(wrapper.intervalId);
      clearTimeout(wrapper.intervalId);
      wrapper.intervalId = null;
    }

    wrapper.isRunning = false;
    wrapper.nextRun = null;

    console.log(`Job "${name}" stopped`);
  }

  /**
   * ลบ job
   */
  removeJob(name: string): void {
    const wrapper = this.jobs.get(name);
    if (!wrapper) {
      console.error(`Job "${name}" not found`);
      return;
    }

    this.stopJob(name);
    this.jobs.delete(name);
    console.log(`Job "${name}" removed`);
  }

  /**
   * หยุดทุก job
   */
  stopAll(): void {
    this.jobs.forEach((_, name) => {
      this.stopJob(name);
    });
  }

  /**
   * ลบทุก job
   */
  removeAll(): void {
    const names = Array.from(this.jobs.keys());
    names.forEach((name) => {
      this.removeJob(name);
    });
  }

  /**
   * ดูข้อมูล job
   */
  getJob(name: string): CronJobInfo | undefined {
    const wrapper = this.jobs.get(name);
    if (!wrapper) return undefined;

    return {
      name: wrapper.name,
      interval: wrapper.interval,
      isRunning: wrapper.isRunning,
      runCount: wrapper.runCount,
      lastRun: wrapper.lastRun,
      nextRun: wrapper.nextRun,
    };
  }

  /**
   * ดูข้อมูลทุก job
   */
  getAllJobs(): CronJobInfo[] {
    return Array.from(this.jobs.keys())
      .map((name) => this.getJob(name)!)
      .filter(Boolean);
  }

  /**
   * ดูจำนวน job ที่กำลังทำงาน
   */
  getRunningJobsCount(): number {
    return Array.from(this.jobs.values()).filter((wrapper) => wrapper.isRunning)
      .length;
  }

  /**
   * ดูเวลารันครั้งต่อไป
   */
  getNextRunTime(name: string): Date | null {
    const wrapper = this.jobs.get(name);
    return wrapper?.nextRun || null;
  }

  // ============================================
  // Helper Methods สำหรับสร้าง interval ง่ายๆ
  // ============================================

  /**
   * ทำงานทุก n วินาที
   */
  addSecondsJob(
    name: string,
    seconds: number,
    onTick: () => void | Promise<void>,
    options?: CronJobOptions
  ): void {
    this.addIntervalJob(name, seconds * 1000, onTick, options);
  }

  /**
   * ทำงานทุก n นาที
   */
  addMinutesJob(
    name: string,
    minutes: number,
    onTick: () => void | Promise<void>,
    options?: CronJobOptions
  ): void {
    this.addIntervalJob(name, minutes * 60 * 1000, onTick, options);
  }

  /**
   * ทำงานทุก n ชั่วโมง
   */
  addHoursJob(
    name: string,
    hours: number,
    onTick: () => void | Promise<void>,
    options?: CronJobOptions
  ): void {
    this.addIntervalJob(name, hours * 60 * 60 * 1000, onTick, options);
  }
}
