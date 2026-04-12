# BA Agent Workflow - CRUD Checklist

## 📋 CHECKLIST: Phân Tích Màn Hình Quản Lý

Khi bạn nhận yêu cầu *"Làm màn hình Quản Lý [X]"*, **BẮT BUỘC** làm theo checklist này:

---

## Step 1: CRUD Scope Questions

Hỏi bạn **4 câu bắt buộc:**

```
🔹 Màn hình Quản Lý [X]:

1️⃣ CREATE - Có tạo mới [X] không?
   A. Có (form riêng/màn hình riêng)
   B. Có (popup modal)
   C. Không cần
   
   ➜ Your choice: ___

2️⃣ READ - Hiển thị gì?
   A. Chỉ danh sách (List view)
   B. Chỉ chi tiết (Detail view)
   C. Cả 2 (List + Detail)
   
   ➜ Your choice: ___

3️⃣ UPDATE - Cho phép sửa [X] không?
   A. Full edit (tất cả fields)
   B. Partial edit (một số fields)
   C. Không cho sửa
   
   ➜ Your choice: ___

4️⃣ DELETE - Xóa [X] thế nào?
   A. Hard delete (xóa vĩnh viễn)
   B. Soft delete (ẩn đi, status = inactive)
   C. Không cho xóa
   
   ➜ Your choice: ___

5️⃣ SPECIAL ACTIONS - Có actions đặc biệt không?
   (Ví dụ: Approve, Reject, Export, Clone, Import, Send Email...)
   
   ➜ Your input: ___________
```

**CHỜ BẠN TRẢ LỜI → Mới làm tiếp!**

---

## Step 2: User Stories Mapping

Với mỗi chức năng, list **Use Cases thực tế:**

| CRUD | Màn hình Orders | Màn hình Customers |
|------|----------------|-------------------|
| **C** | UC: Khách gọi điện đặt hàng | UC: Nhập khách hàng từ Excel |
| **R** | UC: Nhân viên check đơn đang giao | UC: Tìm khách để xem lịch sử mua |
| **U** | UC: Quản lý xác nhận đơn Shopee | UC: Cập nhật hạng VIP khi đủ điểm |
| **D** | UC: Không xóa (chỉ hủy) | UC: Xóa khách spam/trùng |

**Template Use Case:**
```
UC[ID]: [Tên kịch bản]
- Actor: [Ai làm?]
- Trigger: [Sự kiện gì?]
- Steps: [1 → 2 → 3 → Kết quả]
- Business value: [Lợi ích gì?]
```

---

## Step 3: Feature Checklist

Với **mỗi CRUD**, list features chi tiết:

### CREATE Features:
- [ ] Form/Screen để nhập data
- [ ] Validation rules (required fields, format, logic)
- [ ] Auto-fill/Suggest (nếu có)
- [ ] Preview trước khi save
- [ ] Success message + Next actions

### READ Features:
- [ ] List view (table/grid/cards)
- [ ] Pagination (20/50/100 per page)
- [ ] Search (fields nào searchable?)
- [ ] Filters (status, date, category...)
- [ ] Sort (default sort order)
- [ ] Detail view (popup/separate page)
- [ ] Export (Excel/PDF)

### UPDATE Features:
- [ ] Edit form (inline/modal/separate page)
- [ ] Which fields editable?
- [ ] Approval workflow (nếu cần)
- [ ] Version history/Audit log
- [ ] Validation rules

### DELETE Features:
- [ ] Confirm dialog (phòng nhầm)
- [ ] Undo option (nếu hard delete)
- [ ] Cascade delete (xóa related records?)
- [ ] Who can delete? (Permissions)

---

## Step 4: Business Rules Checklist

Hỏi về **7 nhóm rules quan trọng:**

### 1. Permissions (Quyền hạn)
```
- Ai được xem?
- Ai được tạo?
- Ai được sửa?
- Ai được xóa?
- Ai được approve?
```

### 2. Status & Workflow
```
- Có trạng thái nào? (draft/pending/active/completed...)
- Flow chuyển trạng thái?
- Ai được chuyển trạng thái?
- Có approval workflow không?
```

### 3. Validation Rules
```
- Required fields?
- Format (email, phone, date...)
- Business logic (min/max, dependencies...)
- Unique constraints?
```

### 4. Calculations
```
- Có tính toán gì? (tổng tiền, điểm, %)
- Formula?
- Round rules?
- Ví dụ cụ thể?
```

### 5. Integrations
```
- Sync với hệ thống nào? (Shopee, API...)
- Realtime hay batch?
- Failure handling?
```

### 6. Data Retention
```
- Lưu bao lâu?
- Có archive không?
- Có audit log không?
```

### 7. Notifications
```
- Notify ai, khi nào?
- Qua kênh nào? (Email/SMS/In-app)
- Template thế nào?
```

---

## Step 5: File Structure

Tạo files theo template:

```
[project]/
├── [screen-name].html              ← Prototype (Agent 1)
├── docs/
│   └── features-[screen-name].md   ← Feature list (Agent 2)
└── requirements/
    └── req-[screen-name].md        ← Detailed requirements (Agent 3)
```

**Đặt tên chuẩn:**
- ✅ `features-orders.md`, `features-create-order.md`
- ❌ `orders-features.md`, `order_feature.md`

---

## Common Mistakes to Avoid

### ❌ Thiếu CREATE:
**Symptom:** Chỉ có list + detail, không có cách tạo mới
**Fix:** Luôn hỏi "Tạo [X] từ đâu? POS? Form riêng? Import?"

### ❌ Quên SPECIAL ACTIONS:
**Symptom:** Chỉ CRUD cơ bản, thiếu Approve/Clone/Export
**Fix:** Hỏi "Ngoài CRUD, có actions đặc biệt nào không?"

### ❌ Business Rules thiếu:
**Symptom:** Chỉ mô tả UI, không rõ logic
**Fix:** Hỏi 7 nhóm rules (permissions, status, validation...)

### ❌ Use Cases không thực tế:
**Symptom:** UC quá generic như "User xem danh sách"
**Fix:** Hỏi "Trong thực tế, ai xem list này để làm gì?"

---

## Quick Reference: CRUD Options Matrix

| Feature | Implement as... |
|---------|----------------|
| Simple CREATE | Modal popup |
| Complex CREATE (>10 fields) | Separate page |
| Quick READ | List + detail popup |
| Full READ | List page → Detail page |
| Inline UPDATE | Editable table cells |
| Form UPDATE | Modal or separate page |
| Soft DELETE | Status = inactive |
| Hard DELETE | Confirm + cascade check |

---

**Next:** Khi apply checklist này vào màn hình Orders, tôi đã phát hiện thiếu **CREATE** → Tạo `features-create-order.md` ✅
