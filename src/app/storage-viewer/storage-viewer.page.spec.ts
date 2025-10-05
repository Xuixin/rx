import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StorageViewerPage } from './storage-viewer.page';

describe('StorageViewerPage', () => {
  let component: StorageViewerPage;
  let fixture: ComponentFixture<StorageViewerPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(StorageViewerPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
