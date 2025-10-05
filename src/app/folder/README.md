# Camera Demo Page

## 🎥 ฟีเจอร์ที่มี

### 1. **Camera Control**

- ✅ เปิด/ปิดกล้อง
- ✅ สลับกล้องหน้า/หลัง (ถ้ามีหลายตัว)
- ✅ ตรวจสอบ permission อัตโนมัติ
- ✅ Error handling ที่ดี

### 2. **ID Card Overlay**

- ✅ แสดงกรอบบัตรประชาชน real-time
- ✅ เปิด/ปิด overlay ได้
- ✅ มุมกรอบสีเขียวเน้นชัด
- ✅ ข้อความแนะนำ

### 3. **Capture & Preview**

- ✅ ถ่ายรูปจากกล้อง
- ✅ แสดง preview
- ✅ เพิ่ม watermark วันที่/เวลาอัตโนมัติ
- ✅ ดาวน์โหลดรูปได้

### 4. **Reactive State Management**

- ✅ ใช้ **Angular Signals** จาก services
- ✅ UI อัพเดทอัตโนมัติเมื่อ state เปลี่ยน
- ✅ ไม่ต้อง manual subscription
- ✅ Performance ดี

### 5. **Connection Status**

- ✅ แสดงสถานะอินเทอร์เน็ต real-time
- ✅ เปลี่ยนสีตามสถานะ
- ✅ Chip บน toolbar

---

## 🏗️ Architecture ที่ใช้

### Simple Services (No Abstraction)

```
folder.page.ts
├── CameraService      ← Direct injection
├── CanvasService      ← Direct injection
└── InternetService    ← Direct injection
```

**ทำไมไม่ใช้ abstraction?**

- Services เหล่านี้ใช้ Standard Web APIs
- ไม่มีทางเลือก implementation อื่น
- ไม่ซับซ้อน, เข้าใจง่าย
- **YAGNI Principle** - ไม่ over-engineer

---

## 📱 วิธีใช้งาน

### 1. เปิดกล้อง

```typescript
// Component
async startCamera() {
  // Request permission
  const permission = await this.cameraService.requestPermission();

  if (permission.granted) {
    // Start camera
    await this.cameraService.startCamera(videoElement, 'environment');
  }
}
```

### 2. ถ่ายรูป

```typescript
capturePhoto() {
  // Create canvas
  const canvas = this.canvasService.createCanvas(width, height);

  // Draw video frame
  this.canvasService.drawImage(canvas, video);

  // Add watermark
  this.canvasService.addWatermark(canvas, timestamp);

  // Get image
  const image = this.canvasService.captureFrame(canvas);
}
```

### 3. ใช้ Signals

```typescript
// Read-only signals from services
isCameraActive = this.cameraService.isActive;
currentFacingMode = this.cameraService.currentFacingMode;
isOnline = this.internetService.online;

// In template - automatic updates!
{
  {
    isCameraActive();
  }
}
{
  {
    currentFacingMode();
  }
}
{
  {
    isOnline();
  }
}
```

---

## 🎨 UI Components

### Video Wrapper

```html
<div class="video-wrapper">
  <video #videoElement autoplay playsinline></video>
  <canvas #overlayCanvas class="overlay-canvas"></canvas>
</div>
```

### Overlay Drawing

```typescript
private startOverlayLoop() {
  const drawOverlay = () => {
    // Draw ID card guide
    this.canvasService.drawIDCardOverlay(canvas, {
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      cardOutlineColor: '#00ff00',
      cornerLength: 50,
      guideText: 'วางบัตรประชาชนให้อยู่ในกรอบ',
    });

    requestAnimationFrame(drawOverlay);
  };

  drawOverlay();
}
```

---

## 🔧 Features Showcase

### ✅ Permission Handling

```typescript
async requestPermission(): Promise<PermissionStatus> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return { granted: true, message: 'Camera permission granted' };
  } catch (error) {
    if (error.name === 'NotAllowedError') {
      return { granted: false, message: 'Camera permission denied' };
    }
    // ... more error handling
  }
}
```

### ✅ Resource Cleanup

```typescript
ngOnDestroy() {
  // Auto cleanup when leaving page
  this.stopCamera();
}

stopCamera() {
  if (this.stream) {
    this.stream.getTracks().forEach(track => track.stop());
    this.stream = null;
    this._isActive.set(false);
  }
}
```

### ✅ Error Messages

```typescript
// User-friendly error messages
if (error.name === "NotAllowedError") {
  throw new Error("Camera permission denied. Please allow camera access.");
}
if (error.name === "NotFoundError") {
  throw new Error("No camera found on this device.");
}
if (error.name === "NotReadableError") {
  throw new Error("Camera is already in use by another application.");
}
```

---

## 📊 State Flow

```
User clicks "เปิดกล้อง"
    ↓
Request Permission
    ↓
Permission Granted?
    ↓ Yes
Start Camera Stream
    ↓
Update Signal: isActive = true
    ↓
UI Auto-Updates (via Signal)
    ↓
Start Overlay Loop
    ↓
User clicks "ถ่ายรูป"
    ↓
Capture Frame → Canvas
    ↓
Add Watermark
    ↓
Show Preview
```

---

## 🚀 Extensions Ideas

### 1. Add More Features

```typescript
// QR Code scanning
scanQRCode() {
  // Use jsQR library
}

// Face detection
detectFace() {
  // Use face-api.js
}

// Apply filters
applyFilter(filter: 'grayscale' | 'sepia') {
  this.canvasService.applyFilter(canvas, filter);
}
```

### 2. Save to Storage

```typescript
// Using StorageFacade (if needed)
async savePhoto(image: string) {
  const transaction: Transaction = {
    id: `photo-${Date.now()}`,
    userName: 'User',
    files: [{ fileCategory: 'photo', fileBase64: image }],
    // ... other fields
  };

  await this.storage.createTransaction(transaction);
}
```

### 3. Upload to Server

```typescript
async uploadPhoto(image: string) {
  // Convert to Blob
  const blob = await this.canvasService.dataURLToBlob(image);

  // Upload via API
  const formData = new FormData();
  formData.append('photo', blob, 'photo.jpg');

  await this.http.post('/api/upload', formData).toPromise();
}
```

---

## 🧪 Testing

### Component Test

```typescript
describe("FolderPage", () => {
  let cameraServiceMock: jasmine.SpyObj<CameraService>;
  let canvasServiceMock: jasmine.SpyObj<CanvasService>;

  beforeEach(() => {
    cameraServiceMock = jasmine.createSpyObj("CameraService", ["requestPermission", "startCamera", "stopCamera"]);

    canvasServiceMock = jasmine.createSpyObj("CanvasService", ["createCanvas", "drawImage", "addWatermark"]);

    TestBed.configureTestingModule({
      declarations: [FolderPage],
      providers: [
        { provide: CameraService, useValue: cameraServiceMock },
        { provide: CanvasService, useValue: canvasServiceMock },
      ],
    });
  });

  it("should start camera when permission granted", async () => {
    cameraServiceMock.requestPermission.and.returnValue(Promise.resolve({ granted: true, message: "OK" }));

    await component.startCamera();

    expect(cameraServiceMock.startCamera).toHaveBeenCalled();
  });
});
```

---

## 💡 Key Learnings

### 1. **Signals for Reactive State**

- ไม่ต้อง `subscribe()` / `unsubscribe()`
- UI อัพเดทอัตโนมัติ
- Less boilerplate code

### 2. **Simple Services Pattern**

- ไม่ over-engineer
- Direct, readable code
- Easy to maintain

### 3. **Resource Management**

- Always cleanup in `ngOnDestroy()`
- Stop camera streams
- Cancel animation frames

### 4. **User Experience**

- Clear error messages
- Visual feedback
- Responsive design

---

## 📚 Related Files

- **`service/camera.service.ts`** - Camera logic
- **`service/canvas.service.ts`** - Canvas utilities
- **`service/internet.service.ts`** - Network status
- **`service/README.md`** - Architecture guidelines

---

## 🎯 Summary

This demo page showcases:

- ✅ Clean service integration
- ✅ Modern Angular Signals
- ✅ Good error handling
- ✅ Resource cleanup
- ✅ **No unnecessary abstraction**

**Perfect example of YAGNI principle in action!** 🎉
