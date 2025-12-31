# UI Placeholder Designer Tool

## Tổng quan

UI Placeholder Designer là công cụ thiết kế trực quan cho phép tạo wireframe/placeholder cho các màn hình ứng dụng mobile và kiosk. Output là file JSON có cấu trúc chuẩn, có thể được sử dụng để render thành UI thực tế thông qua Claude Code skill.

## Tính năng chính

### 1. Quản lý Project
- **Layouts**: Template chứa các component dùng chung (header, footer, navigation...)
- **Screens**: Màn hình cụ thể, có thể kế thừa từ một Layout
- **Components Library**: Tự động phân loại các widget theo nhóm (header, footer, button, card...)

### 2. Hệ thống Grid
- Mặc định: 64 cột × 36 hàng
- Có thể tùy chỉnh kích thước grid
- Hiển thị/ẩn grid overlay
- Snap-to-grid tự động

### 3. Widget Management
- **Vẽ widget**: Kéo thả để tạo vùng placeholder
- **Di chuyển**: Drag widget đã tạo
- **Resize**: Kéo các handle ở cạnh và góc
- **Rename**: Đổi tên với gợi ý từ component library
- **Duplicate**: Nhân bản widget
- **Delete**: Xóa với confirm popup (Y/N)

### 4. Device Presets
- Phone: 375×667px
- Kiosk: 1080×1920px (scale 0.4)
- Custom: Kích thước tùy chỉnh
- Fit to screen: Tự động scale vừa màn hình

### 5. Import/Export
- Import JSON: Screen, Layout, hoặc Full Project
- Export Project: Toàn bộ project ra file JSON
- Copy JSON: Copy JSON của screen/layout hiện tại

## Cấu trúc dữ liệu JSON

### Project Structure
```json
{
  "name": "Project Name",
  "version": "1.0.0",
  "gridCols": 64,
  "gridRows": 36,
  "device": "phone",
  "layouts": {
    "default": {
      "id": "default",
      "name": "Default Layout",
      "widgets": [...]
    }
  },
  "screens": {
    "home": {
      "id": "home",
      "name": "Home Screen",
      "layoutId": "default",
      "scrollType": "fixed",
      "widgets": [...]
    }
  },
  "exportedAt": "2025-01-01T00:00:00.000Z"
}
```

### Widget Structure
```json
{
  "id": "widget_1",
  "name": "Header",
  "col": 0,
  "row": 0,
  "colSpan": 64,
  "rowSpan": 4,
  "type": "Header"
}
```

**Lưu ý quan trọng:** Field `type` phải chứa tên của component/widget (ví dụ: "Header", "Footer", "Banner", "ProductCard"...). Đây là định danh để skill render có thể map với component thực tế.

### Screen Structure
```json
{
  "id": "home",
  "name": "Home Screen",
  "layoutId": "default",
  "scrollType": "fixed",
  "widgets": [
    {
      "id": "widget_2",
      "name": "Banner",
      "col": 2,
      "row": 5,
      "colSpan": 60,
      "rowSpan": 10,
      "type": "Banner"
    }
  ]
}
```

**Quy tắc:** Mỗi widget phải có `type` là tên component mà nó đại diện. Skill render sẽ dựa vào `type` để biết cần render component nào.

### Layout Structure
```json
{
  "id": "main",
  "name": "Main Layout",
  "widgets": [
    {
      "id": "widget_1",
      "name": "Header",
      "col": 0,
      "row": 0,
      "colSpan": 64,
      "rowSpan": 4,
      "type": "Header"
    },
    {
      "id": "widget_2",
      "name": "Footer",
      "col": 0,
      "row": 32,
      "colSpan": 64,
      "rowSpan": 4,
      "type": "Footer"
    }
  ]
}
```

## Hướng dẫn sử dụng

### Tạo Layout mới
1. Click nút `+` bên cạnh "Layouts" ở panel trái
2. Nhập Layout ID và Name
3. Click "Create"
4. Vẽ các widget cho layout (header, footer...)

### Tạo Screen mới
1. Click nút `+` bên cạnh "Screens"
2. Nhập Screen ID, Name
3. Chọn Base Layout (hoặc No Layout)
4. Chọn Scroll Type (Fixed/Scrollable)
5. Click "Create"

### Vẽ Widget
1. Chọn Layout hoặc Screen cần edit
2. Click và kéo trên canvas để vẽ vùng
3. Release để tạo widget
4. Hover lên widget để hiện toolbar
5. Rename, resize, delete theo nhu cầu

### Export JSON
- **Copy JSON**: Copy JSON của màn hình/layout đang chọn
- **Export**: Download toàn bộ project ra file JSON

### Import JSON
1. Click "Import"
2. Chọn loại import (Screen/Layout/Project)
3. Paste JSON hoặc upload file
4. Click "Import"

## Keyboard Shortcuts
- `Delete`: Xóa widget đang chọn
- `Escape`: Bỏ chọn widget / đóng popup

## Quy tắc thiết kế

### Grid System
- Widget phải căn theo grid
- Position tính theo grid cell (col, row)
- Size tính theo grid span (colSpan, rowSpan)

### Layout Inheritance
- Screen có thể kế thừa từ một Layout
- Widgets từ Layout hiển thị nhưng không edit được trong Screen
- Screen widgets nằm "trên" layout widgets

### Naming Convention
- Widget name nên mô tả chức năng
- System tự động phân loại theo keywords (header, footer, nav, button, card)

## Roadmap tương lai

### Phase 2: Component Details
- Chia nhỏ widget thành UI elements (button, text, input...)
- Properties panel cho từng element
- Style presets

### Phase 3: Collaboration
- Export to Figma/Sketch
- Version control
- Team sharing

### Phase 4: Code Generation
- Generate React/Vue components
- Generate Flutter widgets
- Generate native code

## Tích hợp với Claude Code Skill

JSON output từ tool này có thể được sử dụng với Claude Code skill để:
1. Render thành HTML/CSS prototype
2. Generate React/Vue components
3. Tạo responsive layouts
4. Export thành design specs

Xem thêm: `ui-placeholder-render-skill.md` (coming soon)
