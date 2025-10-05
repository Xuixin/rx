import { Component, OnInit, inject, signal } from '@angular/core';
import { StorageFacade } from '../core/storage/storage.facade';
import { Transaction, ExceptionLog } from '../core/storage/models';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-storage-viewer',
  templateUrl: './storage-viewer.page.html',
  styleUrls: ['./storage-viewer.page.scss'],
  standalone: false,
})
export class StorageViewerPage implements OnInit {
  private storageFacade = inject(StorageFacade);
  private subscriptions = new Subscription();

  // Signals for reactive UI
  transactions = signal<Transaction[]>([]);
  exceptionLogs = signal<ExceptionLog[]>([]);
  unsyncedTransactions = signal<Transaction[]>([]);
  unsyncedLogs = signal<ExceptionLog[]>([]);

  isLoading = signal(true);
  selectedSegment = signal<'transactions' | 'logs'>('transactions');

  // Statistics
  stats = signal({
    totalTransactions: 0,
    unsyncedTransactions: 0,
    totalLogs: 0,
    unsyncedLogs: 0,
  });

  ngOnInit() {
    this.loadAllData();
    // Auto-refresh every 3 seconds to show real-time updates
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  async loadAllData() {
    this.isLoading.set(true);

    try {
      // Load transactions
      const allTransactions = await this.storageFacade.getAllTransactions();
      this.transactions.set(allTransactions);

      const unsyncedTx = await this.storageFacade.getUnsyncedTransactions();
      this.unsyncedTransactions.set(unsyncedTx);

      // Load exception logs
      const allLogs = await this.storageFacade.getAllExceptionLogs();
      this.exceptionLogs.set(allLogs);

      const unsyncedEx = await this.storageFacade.getUnsyncedExceptionLogs();
      this.unsyncedLogs.set(unsyncedEx);

      // Update stats
      this.updateStats();
    } catch (error) {
      console.error('Failed to load storage data:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  startAutoRefresh() {
    // Refresh data every 3 seconds
    const refreshInterval = setInterval(async () => {
      await this.loadAllData();
    }, 3000);

    // Clean up on destroy
    this.subscriptions.add(() => clearInterval(refreshInterval));
  }

  updateStats() {
    this.stats.set({
      totalTransactions: this.transactions().length,
      unsyncedTransactions: this.unsyncedTransactions().length,
      totalLogs: this.exceptionLogs().length,
      unsyncedLogs: this.unsyncedLogs().length,
    });
  }

  segmentChanged(event: any) {
    this.selectedSegment.set(event.detail.value);
  }

  async deleteTransaction(id: string) {
    try {
      await this.storageFacade.deleteTransaction(id);
      console.log('✅ Transaction deleted:', id);
      await this.loadAllData();
    } catch (error) {
      console.error('❌ Failed to delete transaction:', error);
    }
  }

  async deleteLog(id: string) {
    try {
      await this.storageFacade.deleteExceptionLog(id);
      console.log('✅ Exception log deleted:', id);
      await this.loadAllData();
    } catch (error) {
      console.error('❌ Failed to delete log:', error);
    }
  }

  async clearAllTransactions() {
    const confirmed = confirm(
      'Are you sure you want to delete ALL transactions?'
    );
    if (!confirmed) return;

    try {
      const allTx = this.transactions();
      for (const tx of allTx) {
        await this.storageFacade.deleteTransaction(tx.id);
      }
      console.log('✅ All transactions cleared');
      await this.loadAllData();
    } catch (error) {
      console.error('❌ Failed to clear transactions:', error);
    }
  }

  async clearAllLogs() {
    const confirmed = confirm(
      'Are you sure you want to delete ALL exception logs?'
    );
    if (!confirmed) return;

    try {
      const allLogs = this.exceptionLogs();
      for (const log of allLogs) {
        await this.storageFacade.deleteExceptionLog(log.id);
      }
      console.log('✅ All exception logs cleared');
      await this.loadAllData();
    } catch (error) {
      console.error('❌ Failed to clear logs:', error);
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'IN':
        return 'success';
      case 'OUT':
        return 'warning';
      case 'PENDING':
        return 'medium';
      default:
        return 'dark';
    }
  }

  getSyncColor(isSynced: boolean): string {
    return isSynced ? 'success' : 'danger';
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
