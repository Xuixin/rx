import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { StorageViewerPage } from './storage-viewer.page';

const routes: Routes = [
  {
    path: '',
    component: StorageViewerPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StorageViewerPageRoutingModule {}
