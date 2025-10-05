import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { StorageViewerPage } from './storage-viewer.page';
import { StorageViewerPageRoutingModule } from './storage-viewer-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StorageViewerPageRoutingModule,
  ],
  declarations: [StorageViewerPage],
})
export class StorageViewerPageModule {}
