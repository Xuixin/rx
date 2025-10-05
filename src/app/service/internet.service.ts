import { Injectable, signal, computed, effect } from '@angular/core';
import { Platform } from '@ionic/angular';

/**
 * Internet Connectivity Service
 *
 * Simple service for monitoring network status.
 * No abstraction layer needed because:
 * - Network API is standard across platforms
 * - Rarely needs different implementations
 * - Logic is straightforward
 */
@Injectable({
  providedIn: 'root',
})
export class InternetService {
  // Signals
  private isOnline = signal<boolean>(navigator.onLine);

  // Public readonly signal
  readonly online = this.isOnline.asReadonly();

  // Computed signals
  readonly offline = computed(() => !this.isOnline());
  readonly connectionStatus = computed(() =>
    this.isOnline() ? 'connected' : 'disconnected'
  );

  constructor(private platform: Platform) {
    this.initNetworkListener();

    // Optional: Log connection changes
    effect(() => {
      console.log(`📡 Network status: ${this.connectionStatus()}`);
    });
  }

  /**
   * Initialize network status listeners
   */
  private initNetworkListener(): void {
    // Listen to browser/Capacitor network events
    window.addEventListener('online', () => this.updateStatus(true));
    window.addEventListener('offline', () => this.updateStatus(false));

    // Initial check
    this.updateStatus(navigator.onLine);
  }

  /**
   * Update connection status
   */
  private updateStatus(isOnline: boolean): void {
    this.isOnline.set(isOnline);
  }

  /**
   * Check if currently online
   */
  isConnected(): boolean {
    return this.isOnline();
  }

  /**
   * Check if currently offline
   */
  isDisconnected(): boolean {
    return !this.isOnline();
  }

  /**
   * Get connection type (if using Capacitor Network plugin)
   * Can be extended later if needed
   */
  async getConnectionType(): Promise<string> {
    // For now, just return basic info
    return this.isOnline() ? 'online' : 'offline';

    // Future: Use Capacitor Network plugin
    // const status = await Network.getStatus();
    // return status.connectionType;
  }
}
