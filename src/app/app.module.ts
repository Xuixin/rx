import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { StorageModule } from './core/storage/storage.module';
import { ApiModule } from './core/api/api.module';
import { StorageFacade } from './core/storage';

// Initialize database before app starts
export function initializeDatabase(storageFacade: StorageFacade) {
  return () => storageFacade.initialize();
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    StorageModule,
    ApiModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDatabase,
      deps: [StorageFacade],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
