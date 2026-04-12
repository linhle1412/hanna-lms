# Màn Hình: Quản Lý Đơn Hàng

## Mục Đích
Hiển thị danh sách tất cả đơn hàng từ nhiều kênh bán (cửa hàng, Shopee, Lazada, Website, TikTok) để nhân viên và quản lý có thể xem, tìm kiếm, và theo dõi trạng thái đơn hàng.

---

## Use Cases (Kịch Bản Thực Tế)

**UC1: Bán hàng tại quầy (POS)**
- Khách đến cửa hàng → Thu ngân dùng POS thêm sản phẩm → Thanh toán → Đơn tự động lưu vào hệ thống → Hiện trong màn hình Quản Lý Đơn Hàng

**UC2: Khách gọi điện hỏi đơn hàng**
- Nhân viên search SĐT → Tìm thấy đơn → Xem status → Trả lời khách

**UC3: Xử lý đơn Shopee mới**
- Shopee có đơn mới (webhook) → Hiện trong list → Quản lý xác nhận → Chuyển sang Processing

**UC4: Check đơn đang giao**
- Quản lý filter "Đang giao" → Xem list → Click tracking để check vị trí shipper

**UC5: Khách hủy đơn**
- Khách gọi hủy → Quản lý tìm đơn → Click hủy → Chọn lý do "Khách hủy" → Hàng hoàn về kho

**UC6: Đối soát cuối ngày**
- Quản lý filter "Hôm nay" + "Hoàn thành" → Export Excel → Đối chiếu tiền mặt

---

## Business Rules

### Trạng Thái Đơn Hàng
- **Flow chuẩn:** Pending → Processing → Shipping → Completed
- **Chuyển trạng thái:**
  - Pending → Processing: Manual (Quản lý click xác nhận)
  - Processing → Shipping: Manual (Click "Giao hàng")
  - Shipping → Completed: Tự động (Tracking API confirm đã giao)
- **Hủy đơn:** Chỉ được hủy ở Pending hoặc Processing
- **Lý do hủy:** Bắt buộc chọn (Hết hàng / Khách hủy / Sai thông tin / Khác)
- **Hoàn kho:** Tự động hoàn lại tồn kho khi hủy đơn

### Quyền Hạn
- **Nhân viên:** Chỉ xem (Read-only)
- **Quản lý:** Full quyền chi nhánh (Xem/Xác nhận/Hủy/In/Export)
- **Thu ngân:** Xem tất cả đơn chi nhánh

### Đồng Bộ Đa Kênh
- **Nhận đơn:** Realtime webhook từ Shopee/Lazada
- **Trừ kho:** Ngay khi nhận đơn (status = Pending)
- **Hết hàng:** Đặt status "Chờ nhập hàng" + Notify quản lý
- **Sync status:** Realtime update về platform khi update trong hệ thống
- **Tracking:** Nhập manual

### Tính Tiền
- **Khuyến mãi online:** Áp dụng giống offline (10% ≥500k, quà tặng)
- **Phí ship:** Field riêng (không tính vào "Tổng tiền")
- **Hiển thị:** Tạm tính - Giảm giá (+ Tên KM) = Tổng cộng

### Dữ Liệu
- **Pagination:** 20/50/100 đơn/trang (user chọn)
- **Filter chi nhánh:** Có (Quận 1/3/5/Tất cả)
- **Lưu trữ:** Vĩnh viễn
- **Stats:** Tổng hợp tất cả kênh, auto-refresh 30s

---

## Features Chính

### F1: Stats Cards (KPIs)
- Tổng đơn hôm nay
- Đang xử lý = Pending + Processing
- Hoàn thành
- Đã hủy + % tỷ lệ
- So sánh hôm qua
- Auto-refresh 30s

### F2: Danh Sách Đơn Hàng
**Data hiển thị:**
- Mã đơn, Khách hàng (Tên + SĐT), Số sản phẩm, Kênh, Tổng tiền, Trạng thái, Thời gian
- 20/50/100 đơn/trang
- Sort: Mới nhất trước

**Actions:**
- Click 👁️ → Xem chi tiết popup

### F3: Tìm Kiếm
- Input: Mã đơn, SĐT, Tên khách
- Realtime filter khi gõ
- Match: order_code, phone, customer_name

### F4: Lọc Đơn Hàng
**Filters:**
- Kênh: Store/Shopee/Lazada/Website/TikTok/Tất cả
- Trạng thái: Pending/Processing/Shipping/Completed/Cancelled/Tất cả
- Ngày: Date picker
- Chi nhánh: Q1/Q3/Q5/Tất cả

**Logic:** Có thể combine nhiều filters cùng lúc

### F5: Xem Chi Tiết
**Trigger:** Click 👁️

**Popup data:**
- **Khách hàng:** Tên, SĐT, Email, Hạng, Điểm
- **Đơn hàng:** Kênh, Thu ngân/Platform, Thời gian, Payment method
- **Sản phẩm:** Table (Tên | SL | Đơn giá | Thành tiền)
  - Quà tặng: Có label 🎁
- **Tổng tiền:** Tạm tính - Giảm giá (+ Tên KM) = Tổng cộng

---

## Data Model (Core Tables)

### Table: orders
- order_code (unique)
- customer_id
- channel (enum)
- items_count
- subtotal
- discount
- total
- shipping_fee
- status (enum)
- payment_method
- cashier_id
- created_at

### Table: order_items
- order_id
- product_id
- product_name (snapshot)
- quantity
- unit_price (snapshot)
- subtotal
- is_gift

**Relationships:**
- orders → customers (Many-to-One)
- orders → order_items (One-to-Many)

---

## Logic Quan Trọng

### Tính Tổng Tiền
```
subtotal = SUM(item.unit_price × item.quantity) WHERE is_gift = FALSE
discount = Apply khuyến mãi (nếu có)
total = subtotal - discount
```

**Ví dụ:**
- 2x Son Dior (350k) = 700k
- 1x Serum (450k) = 450k
- Tạm tính = 1,150k
- Giảm 10% (KM ≥500k) = -115k
- **Tổng = 1,035k**

---

**File**: `features-orders.md` | **Pages**: 1 trang
