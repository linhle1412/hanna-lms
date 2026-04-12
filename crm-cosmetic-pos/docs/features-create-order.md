# Màn Hình: Tạo Đơn Hàng Thủ Công

## Mục Đích
Cho phép nhân viên tạo đơn hàng thủ công khi khách gọi điện đặt hàng, đặt qua Zalo/Facebook, hoặc nhập đơn từ nguồn khác không qua POS.

---

## Use Cases (Kịch Bản Thực Tế)

**UC1: Khách gọi điện đặt hàng**
- Khách gọi hỏi sản phẩm → Nhân viên tư vấn → Khách đồng ý mua → Nhân viên tạo đơn trên hệ thống → Ghi chú địa chỉ giao → Xác nhận → Đơn vào hệ thống

**UC2: Nhận đơn qua Zalo/Facebook**
- Khách nhắn inbox Facebook → Nhân viên check tồn kho → Tạo đơn thủ công → Chọn kênh "Website" → Gửi link thanh toán cho khách

**UC3: Đặt hàng cho khách VIP**
- Khách VIP gọi trực tiếp quản lý → Quản lý tạo đơn ưu tiên → Áp dụng discount đặc biệt → Giao hàng miễn phí

**UC4: Tạo đơn trả góp**
- Khách muốn trả góp qua thẻ tín dụng → Nhân viên tạo đơn → Chọn payment "Trả góp" → Nhập thông tin thẻ → Xác nhận với ngân hàng

**UC5: Đơn hàng sỉ (B2B)**
- Đại lý gọi đặt 100 sản phẩm → Nhân viên tạo đơn B2B → Áp dụng giá sỉ → Không tính phí ship → Xuất kho hàng loạt

---

## Business Rules

### Thông Tin Khách Hàng
- **Bắt buộc:** Tên, SĐT
- **Tùy chọn:** Email, Địa chỉ (bắt buộc nếu giao hàng)
- **Tìm khách:** Search SĐT → Auto-fill thông tin nếu đã tồn tại
- **Khách mới:** Tạo profile mới trong database

### Chọn Sản Phẩm
- **Search:** Theo tên, mã SP, barcode
- **Stock check:** Realtime hiển thị tồn kho
- **Hết hàng:** Vẫn cho phép tạo đơn → Status = "Chờ nhập hàng"
- **Multi-branch:** Chọn lấy hàng từ chi nhánh nào

### Khuyến Mãi
- **Tự động:** Áp dụng KM giống POS (10% ≥500k, quà tặng)
- **Manual:** Quản lý có thể override discount (cần lý do)
- **VIP discount:** Tự động áp dụng theo hạng khách
- **Coupon:** Nhập mã giảm giá (validate trước khi apply)

### Phí Ship
- **Tự động:** Tính theo khoảng cách (API GHN/Giao Hàng Nhanh)
- **Manual:** Quản lý có thể nhập tay
- **Miễn phí:** Đơn ≥1tr hoặc khách VIP Gold+

### Payment
- **Methods:** Tiền mặt (COD), Chuyển khoản, Thẻ, Ví điện tử, Trả góp
- **COD:** Thu tiền khi giao
- **Chuyển khoản:** Status = "Chờ thanh toán" → Confirm khi nhận tiền
- **Trả góp:** Cần approval từ ngân hàng

### Quyền Hạn
- **Nhân viên:** Tạo đơn cơ bản, không override discount
- **Quản lý:** Full quyền, override discount, approve đơn lớn (≥5tr)
- **Thu ngân:** Chỉ xem, không tạo

### Validation
- **Tối thiểu:** 1 sản phẩm, thông tin khách đủ
- **Tổng tiền ≥50k:** Đơn dưới 50k không cho tạo (shipping cost cao hơn)
- **Địa chỉ:** Bắt buộc nếu chọn "Giao hàng"

---

## Features Chính

### F1: Form Thông Tin Khách Hàng
**Fields:**
- Tên khách hàng (required)
- SĐT (required, validate format)
- Email (optional)
- Địa chỉ giao hàng (required nếu ship)
- Ghi chú đơn hàng

**Search khách:**
- Input SĐT → Auto-suggest nếu tồn tại
- Click → Auto-fill tất cả fields
- Hiển thị: Hạng, Điểm, Lịch sử mua hàng

### F2: Chọn Sản Phẩm
**Search:**
- Input: Tên, Mã SP, Barcode
- Realtime suggest với ảnh thumbnail
- Hiển thị: Tên | Giá | Tồn kho | Chi nhánh

**Add to cart:**
- Click → Thêm vào danh sách
- Nhập số lượng
- Check stock realtime
- Warning nếu số lượng > tồn kho

### F3: Giỏ Hàng
**Display:**
- Table: Sản phẩm | SL | Đơn giá | Thành tiền | Actions
- Tăng/giảm số lượng (+/-)
- Xóa sản phẩm (🗑️)
- Quà tặng: Label 🎁

**Summary:**
- Tạm tính
- Giảm giá (+ Tên KM)
- Phí ship
- **TỔNG CỘNG**

### F4: Khuyến Mãi & Discount
**Auto:**
- Apply KM theo rules (hiển thị banner)
- Ví dụ: "Giảm 10% cho đơn ≥500k"

**Manual (Quản lý only):**
- Nhập % hoặc số tiền
- Bắt buộc chọn lý do:
  - Khách VIP
  - Bù lỗi sản phẩm
  - Khuyến mãi đặc biệt
  - Khác (nhập text)

### F5: Tính Phí Ship
**Auto:**
- Input: Địa chỉ khách → Call API GHN → Trả về giá
- Hiển thị: "Phí ship: 30,000đ (GHN Express)"

**Manual:**
- Checkbox "Nhập tay" → Input field
- Ví dụ: Tự giao = 0đ

**Miễn phí:**
- Nếu đơn ≥1tr → Phí = 0đ (hiển thị "Miễn phí ship")

### F6: Payment & Giao Hàng
**Payment method:**
- Radio buttons: COD / Chuyển khoản / Thẻ / Ví / Trả góp
- Nếu "Chuyển khoản": Hiển thị QR code ngân hàng

**Giao hàng:**
- Radio: Tự đến lấy / Giao hàng / Giao hàng nhanh (GHN)
- Nếu giao: Chọn ngày giao mong muốn (date picker)

### F7: Xác Nhận & Tạo Đơn
**Preview:**
- Hiển thị tất cả thông tin trước khi tạo
- Button: "Quay lại sửa" | "Xác nhận tạo đơn"

**Success:**
- Popup: "Đơn hàng #ORD-12345 đã được tạo thành công!"
- Actions: In đơn | Gửi SMS | Copy link tracking | Đóng

---

## Data Model (Core Tables)

### Table: orders
- order_code (unique, auto-gen)
- customer_id (FK)
- channel (enum: manual/phone/zalo/facebook)
- items_count
- subtotal
- discount
- discount_reason (text)
- shipping_fee
- total
- status (default: pending)
- payment_method
- payment_status (enum: unpaid/paid/refunded)
- shipping_method
- shipping_address
- delivery_date
- notes
- created_by (user_id)
- created_at

### Table: order_items
- (Same as features-orders.md)

**Relationships:**
- orders → customers
- orders → users (created_by)

---

## Logic Quan Trọng

### Tính Tổng Tiền
```
subtotal = SUM(item.unit_price × item.quantity) WHERE is_gift = FALSE
discount_auto = Apply khuyến mãi tự động
discount_manual = Quản lý nhập (nếu có)
shipping_fee = API GHN hoặc manual
total = subtotal - discount_auto - discount_manual + shipping_fee
```

**Ví dụ:**
- 3x Son Dior (350k) = 1,050k
- Discount tự động 10% = -105k
- Discount VIP thêm 5% = -52.5k
- Phí ship = 30k
- **Tổng = 922.5k**

### Validation Flow
```
User click "Tạo đơn"
↓
Check: Có sản phẩm trong giỏ? NO → Error "Giỏ hàng trống"
↓
Check: Thông tin khách đủ? NO → Error "Nhập SĐT + Tên"
↓
Check: Địa chỉ (nếu ship)? NO → Error "Nhập địa chỉ giao"
↓
Check: Tổng tiền ≥50k? NO → Error "Đơn tối thiểu 50,000đ"
↓
Check: Stock đủ? NO → Confirm "Tạo đơn 'Chờ nhập hàng'?"
↓
All pass → Create order + Trừ kho + Notify
```

---

**File**: `features-create-order.md` | **Pages**: 1 trang
