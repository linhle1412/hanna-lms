# Stock Take (Kiểm Kho) Process Diagrams

## 1. Basic Stock Take Process Flow

```mermaid
flowchart TD
    Start([Bắt đầu]) --> CreateSession[Manager tạo<br/>phiên kiểm kho]
    
    CreateSession --> SetupInfo{Nhập thông tin<br/>cơ bản}
    
    SetupInfo --> |Tên phiên<br/>Chi nhánh<br/>Ngày kiểm| SelectScope[Chọn phạm vi kiểm]
    
    SelectScope --> ScopeType{Phạm vi?}
    
    ScopeType -->|Toàn bộ| AllProducts[Tất cả sản phẩm]
    ScopeType -->|Danh mục| CategoryProducts[Theo danh mục]
    ScopeType -->|Random| RandomSample[Random sampling 10%]
    
    AllProducts --> GenerateList[Hệ thống generate<br/>danh sách sản phẩm]
    CategoryProducts --> GenerateList
    RandomSample --> GenerateList
    
    GenerateList --> AssignStaff[Assign người kiểm kho]
    
    AssignStaff --> ExportOption{Xuất phiếu<br/>kiểm?}
    
    ExportOption -->|Có| ExportSheet[Export Excel/PDF]
    ExportOption -->|Không| StartCount
    
    ExportSheet --> StartCount[Bắt đầu đếm hàng]
    
    StartCount --> CountMethod{Phương pháp?}
    
    CountMethod -->|Manual| ManualCount[Nhập thủ công<br/>từng sản phẩm]
    CountMethod -->|Import| ImportSheet[Upload Excel<br/>đã điền]
    
    ManualCount --> EnterActual[Nhập số lượng<br/>thực tế]
    ImportSheet --> ValidateData[Validate dữ liệu]
    
    ValidateData --> EnterActual
    
    EnterActual --> CalcVariance[Hệ thống tính<br/>Variance tự động]
    
    CalcVariance --> ShowVariance[Hiển thị:<br/>Hệ thống | Thực tế | Chênh lệch]
    
    ShowVariance --> SaveOption{Lưu nháp<br/>hay hoàn tất?}
    
    SaveOption -->|Lưu nháp| SaveDraft[Lưu để<br/>tiếp tục sau]
    SaveOption -->|Hoàn tất| ReviewVariance[Review chênh lệch]
    
    SaveDraft --> CanResume[Có thể resume<br/>sau này]
    CanResume --> StartCount
    
    ReviewVariance --> CheckLarge{Có chênh lệch<br/>lớn > 5%?}
    
    CheckLarge -->|Có| EnterReason[Nhập lý do<br/>chênh lệch]
    CheckLarge -->|Không| ManagerApprove
    
    EnterReason --> ManagerApprove[Manager review<br/>& approve]
    
    ManagerApprove --> ApproveDecision{Approve?}
    
    ApproveDecision -->|Reject| Recount[Yêu cầu<br/>kiểm lại]
    ApproveDecision -->|Approve| UpdateStock[Cập nhật tồn kho<br/>= Số thực tế]
    
    Recount --> StartCount
    
    UpdateStock --> CreateAdjustment[Tự động tạo<br/>Stock Adjustment]
    
    CreateAdjustment --> LogHistory[Ghi log chi tiết<br/>vào lịch sử]
    
    LogHistory --> GenerateReport[Generate báo cáo<br/>Accuracy Rate<br/>Variance Summary]
    
    GenerateReport --> NotifyStaff[Notify người kiểm<br/>& stakeholders]
    
    NotifyStaff --> End([Hoàn tất])
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style UpdateStock fill:#90EE90
    style Recount fill:#FFB6C1
    style SaveDraft fill:#FFE4B5
```

## 2. Enhanced Stock Take with 7 Features

```mermaid
flowchart TD
    Start([Bắt đầu]) --> Setup[Manager tạo<br/>phiên kiểm kho]
    
    Setup --> SelectType{Chọn loại<br/>kiểm kho}
    
    SelectType -->|Full Count| FullCount[Kiểm toàn bộ<br/>End-of-month]
    SelectType -->|Cycle Count| CycleCount[Kiểm tuần hoàn<br/>ABC Classification]
    
    FullCount --> FreezeOption{Enable<br/>Freeze Inventory?}
    CycleCount --> NoFreeze[Không freeze<br/>Continuous operation]
    
    FreezeOption -->|Hard Freeze| HardFreeze[🔒 Block tất cả<br/>nhập/xuất]
    FreezeOption -->|Soft Freeze| SoftFreeze[🔔 Warning khi<br/>nhập/xuất]
    FreezeOption -->|No Freeze| NoFreeze
    
    HardFreeze --> TeamSetup
    SoftFreeze --> TeamSetup
    NoFreeze --> TeamSetup[👥 Team Assignment]
    
    TeamSetup --> AssignTeams[Assign tasks:<br/>Team A: Kệ A1-A10<br/>Team B: Kệ B1-B10]
    
    AssignTeams --> ExportSheet[📄 Export Count Sheet<br/>Excel/PDF]
    
    ExportSheet --> BlindCount{Blind Count?}
    
    BlindCount -->|Yes| HideQty[Không hiển thị<br/>số hệ thống]
    BlindCount -->|No| ShowQty[Hiển thị<br/>số hệ thống]
    
    HideQty --> CountMode
    ShowQty --> CountMode{Phương pháp đếm?}
    
    CountMode -->|Barcode Scan| BarcodeScan[📷 Scan barcode<br/>Quick count mode]
    CountMode -->|Manual| ManualEntry[Nhập thủ công]
    CountMode -->|Import| ImportFile[Upload Excel]
    
    BarcodeScan --> ScanLoop[Scan → Beep! +1<br/>Realtime update]
    ManualEntry --> EnterData[Nhập số lượng]
    ImportFile --> ValidateImport[Validate data]
    
    ScanLoop --> TeamProgress
    EnterData --> TeamProgress
    ValidateImport --> TeamProgress[📊 Track progress<br/>mỗi team]
    
    TeamProgress --> PartialSubmit{Partial<br/>Submission?}
    
    PartialSubmit -->|Yes| SubmitBatch[Submit Batch<br/>Save progress]
    PartialSubmit -->|No| ContinueCount{Đếm xong<br/>chưa?}
    
    SubmitBatch --> UpdateProgress[Update:<br/>Team A: 50/50 ✅<br/>Team B: 27/45 ⏳]
    
    UpdateProgress --> ContinueCount
    
    ContinueCount -->|Chưa| CountMode
    ContinueCount -->|Rồi| AllDone[100% completed]
    
    AllDone --> AggregateData[Aggregate dữ liệu<br/>từ tất cả teams]
    
    AggregateData --> CalcVariance[Tính Variance<br/>cho từng sản phẩm]
    
    CalcVariance --> CheckThreshold{Variance<br/>Threshold?}
    
    CheckThreshold -->|< 5%| AutoApprove[✅ Auto-approve<br/>Cập nhật ngay]
    CheckThreshold -->|5-10%| SupervisorQueue[⏳ Chờ Supervisor<br/>approve]
    CheckThreshold -->|> 10%| ManagerQueue[🚨 Chờ Manager<br/>+ Investigation Report]
    
    SupervisorQueue --> SupervisorReview{Supervisor<br/>decision}
    ManagerQueue --> CheckReport{Có Investigation<br/>Report?}
    
    CheckReport -->|Không| RequestReport[Yêu cầu điền<br/>Investigation Report]
    CheckReport -->|Có| ManagerReview{Manager<br/>decision}
    
    RequestReport --> ManagerReview
    
    SupervisorReview -->|Approve| UpdateInventory
    SupervisorReview -->|Reject| DoubleCount[Yêu cầu<br/>Double Count]
    
    ManagerReview -->|Approve| UpdateInventory[Cập nhật tồn kho<br/>= Số thực tế]
    ManagerReview -->|Reject| DoubleCount
    
    DoubleCount --> AssignOther[Assign người khác<br/>kiểm lại]
    AssignOther --> CountMode
    
    AutoApprove --> UpdateInventory
    
    UpdateInventory --> UnfreezeCheck{Có freeze<br/>inventory?}
    
    UnfreezeCheck -->|Yes| Unfreeze[🔓 Unfreeze inventory<br/>Resume operations]
    UnfreezeCheck -->|No| GenerateReport
    
    Unfreeze --> GenerateReport[Generate Report:<br/>✅ Accuracy Rate<br/>📊 Variance by product<br/>💰 $ Value impact<br/>👥 Team performance]
    
    GenerateReport --> NotifyAll[📧 Notify:<br/>• Teams<br/>• Supervisor<br/>• Manager<br/>• Accounting]
    
    NotifyAll --> End([Hoàn tất])
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style AutoApprove fill:#90EE90
    style UpdateInventory fill:#90EE90
    style DoubleCount fill:#FFB6C1
    style HardFreeze fill:#FFD700
    style BarcodeScan fill:#87CEEB
    style PartialSubmit fill:#FFE4B5
```

## 3. Approval Workflow Detail

```mermaid
flowchart TD
    Start([Phiên kiểm kho<br/>hoàn tất]) --> Calculate[Tính Variance<br/>cho tất cả sản phẩm]
    
    Calculate --> GroupByThreshold[Phân nhóm theo<br/>Variance Threshold]
    
    GroupByThreshold --> Group1[Group 1:<br/>Variance < 5%]
    GroupByThreshold --> Group2[Group 2:<br/>Variance 5-10%]
    GroupByThreshold --> Group3[Group 3:<br/>Variance > 10%]
    
    Group1 --> Auto[✅ Auto-approve<br/>Không cần review]
    
    Group2 --> NotifySupervisor[📧 Email Supervisor<br/>với chi tiết variance]
    
    NotifySupervisor --> SupervisorLogin[Supervisor login<br/>xem pending approvals]
    
    SupervisorLogin --> SupervisorReview[Review từng item:<br/>• Product<br/>• System: 45<br/>• Actual: 42<br/>• Variance: -3 -6.7%<br/>• Reason from staff]
    
    SupervisorReview --> SupervisorDecide{Decision?}
    
    SupervisorDecide -->|Approve All| ApproveG2[Approve Group 2]
    SupervisorDecide -->|Reject Some| RejectG2[Reject & request<br/>recount]
    
    Group3 --> CheckInvestigation{Có Investigation<br/>Report?}
    
    CheckInvestigation -->|Không| BlockApproval[❌ Block approval<br/>Yêu cầu báo cáo]
    CheckInvestigation -->|Có| NotifyManager[📧 Email Manager<br/>+ Investigation Report]
    
    BlockApproval --> StaffFillReport[Staff điền<br/>Investigation Report:<br/>• Nguyên nhân<br/>• Người chịu trách nhiệm<br/>• Hành động khắc phục<br/>• Evidence photos]
    
    StaffFillReport --> NotifyManager
    
    NotifyManager --> ManagerLogin[Manager login<br/>xem high variance items]
    
    ManagerLogin --> ManagerReview[Review chi tiết:<br/>• Variance analysis<br/>• Investigation report<br/>• History của sản phẩm<br/>• Staff track record]
    
    ManagerReview --> ManagerDecide{Decision?}
    
    ManagerDecide -->|Approve| ApproveG3[Approve Group 3<br/>Ghi nhận loss]
    ManagerDecide -->|Request Double Count| RequestDouble[Assign người khác<br/>kiểm lại]
    ManagerDecide -->|Escalate| EscalateGM[Escalate to<br/>General Manager]
    
    Auto --> UpdateDB[Cập nhật Database]
    ApproveG2 --> UpdateDB
    ApproveG3 --> UpdateDB
    RejectG2 --> RecountQueue[Add to recount queue]
    RequestDouble --> RecountQueue
    EscalateGM --> GMReview[GM Review<br/>Final decision]
    
    GMReview --> UpdateDB
    
    UpdateDB --> CreateAdjustments[Tạo Stock Adjustment<br/>records cho audit]
    
    CreateAdjustments --> SendNotification[Send notifications<br/>to all stakeholders]
    
    SendNotification --> End([Hoàn tất])
    
    RecountQueue --> End2([Chờ recount])
    
    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style End2 fill:#FFE4B5
    style Auto fill:#90EE90
    style ApproveG2 fill:#90EE90
    style ApproveG3 fill:#90EE90
    style BlockApproval fill:#FFB6C1
    style EscalateGM fill:#FF6347
```

## 4. Team-based Stock Take Sequence

```mermaid
sequenceDiagram
    actor Manager as Warehouse Manager
    actor TeamA as Team A Leader
    actor TeamB as Team B Leader
    actor Supervisor as Supervisor
    participant System as System
    participant DB as Database
    
    Note over Manager,DB: Phase 1: Setup & Assignment
    
    Manager->>System: Tạo phiên kiểm kho
    System->>System: Generate product list (100 items)
    
    Manager->>System: Assign tasks
    Note right of Manager: Team A: 50 items<br/>Team B: 50 items
    
    System->>TeamA: 📧 Notification + Task list
    System->>TeamB: 📧 Notification + Task list
    
    Note over Manager,DB: Phase 2: Counting (Parallel)
    
    par Team A counting
        TeamA->>System: Bắt đầu đếm
        TeamA->>System: Scan barcode #1
        System->>TeamA: Beep! Count: 1
        TeamA->>System: Scan barcode #2
        System->>TeamA: Beep! Count: 2
        TeamA->>System: ...continue...
        TeamA->>System: Submit Batch 1 (25 items)
        System->>DB: Save progress 25/50
        System->>Manager: 🔔 Team A: 50% done
    and Team B counting
        TeamB->>System: Bắt đầu đếm
        TeamB->>System: Nhập manual item 1
        TeamB->>System: Nhập manual item 2
        TeamB->>System: ...continue...
        TeamB->>System: Submit Batch 1 (20 items)
        System->>DB: Save progress 20/50
        System->>Manager: 🔔 Team B: 40% done
    end
    
    Note over Manager,DB: Phase 3: Continue & Complete
    
    TeamA->>System: Submit Batch 2 (25 items)
    System->>DB: Save 50/50 ✅
    System->>Manager: 🔔 Team A: Completed!
    
    TeamB->>System: Submit Batch 2 (30 items)
    System->>DB: Save 50/50 ✅
    System->>Manager: 🔔 Team B: Completed!
    
    Note over Manager,DB: Phase 4: Aggregation & Variance
    
    System->>System: Aggregate all data (100 items)
    System->>System: Calculate variance for each item
    
    System->>DB: Save variance results
    System->>Manager: 📊 Variance report ready
    
    Note over Manager,DB: Phase 5: Approval Workflow
    
    Manager->>System: Review variance report
    
    alt Có items cần Supervisor approval
        System->>Supervisor: 📧 Approval request (10 items, 5-10% variance)
        Supervisor->>System: Login & review
        Supervisor->>System: Approve 8 items
        Supervisor->>System: Reject 2 items (recount needed)
        System->>DB: Update approval status
        System->>TeamA: 🔔 Recount 2 items
    end
    
    alt Có items cần Manager approval
        System->>Manager: 🚨 High variance alert (3 items >10%)
        Manager->>System: Review Investigation Reports
        Manager->>System: Approve with notes
        System->>DB: Update with Manager approval
    end
    
    Note over Manager,DB: Phase 6: Update & Complete
    
    System->>DB: Update inventory = actual count
    System->>DB: Create Stock Adjustment records
    System->>DB: Log complete history
    
    System->>Manager: ✅ Stock take completed
    System->>TeamA: ✅ Thank you notification
    System->>TeamB: ✅ Thank you notification
    System->>Supervisor: 📊 Final report
```

## 5. Barcode Scanning Flow

```mermaid
flowchart TD
    Start([Staff bắt đầu<br/>counting session]) --> OpenApp[Mở Stock Take<br/>trên device]
    
    OpenApp --> SelectMode{Chọn mode}
    
    SelectMode -->|Quick Scan| QuickMode[Quick Scan Mode:<br/>Scan = Auto +1]
    SelectMode -->|Manual Entry| ManualMode[Manual Mode:<br/>Scan → Enter qty]
    
    QuickMode --> ScanReady[📷 Scanner ready<br/>Focus on barcode input]
    ManualMode --> ScanReady
    
    ScanReady --> Scan[Scan barcode]
    
    Scan --> LookupDB[System lookup<br/>barcode trong database]
    
    LookupDB --> Found{Tìm thấy?}
    
    Found -->|Không| UnknownBarcode[❌ Unknown barcode<br/>Beep beep beep!]
    Found -->|Có| LoadProduct[Load thông tin:<br/>• Tên sản phẩm<br/>• SKU<br/>• Current count<br/>• Expected qty optional]
    
    UnknownBarcode --> OfferAdd{Add new<br/>product?}
    OfferAdd -->|Yes| AddProduct[Form thêm sản phẩm mới]
    OfferAdd -->|No| ScanReady
    
    AddProduct --> LoadProduct
    
    LoadProduct --> CheckMode{Mode?}
    
    CheckMode -->|Quick| AutoIncrement[✅ Auto +1<br/>Beep!]
    CheckMode -->|Manual| PromptQty[Nhập số lượng]
    
    PromptQty --> Confirm[Confirm]
    Confirm --> AutoIncrement
    
    AutoIncrement --> UpdateDisplay[Update hiển thị:<br/>📦 Product Name<br/>Count: 5 → 6]
    
    UpdateDisplay --> CheckDuplicate{Đã scan<br/>product này?}
    
    CheckDuplicate -->|Lần đầu| SaveNew[Lưu item mới<br/>vào count list]
    CheckDuplicate -->|Đã scan| UpdateExisting[Cập nhật count<br/>của item có sẵn]
    
    SaveNew --> FeedbackSuccess
    UpdateExisting --> FeedbackSuccess[✅ Visual feedback:<br/>• Green flash<br/>• Sound beep<br/>• Vibration]
    
    FeedbackSuccess --> CheckList{Check toàn bộ<br/>task list}
    
    CheckList --> ShowProgress[Hiển thị progress:<br/>✅ 15/50 items<br/>⏳ 35 remaining]
    
    ShowProgress --> ContinueOption{Tiếp tục?}
    
    ContinueOption -->|Yes| ScanReady
    ContinueOption -->|Save & Pause| SaveProgress[💾 Save progress<br/>Can resume later]
    ContinueOption -->|Submit| SubmitBatch[📤 Submit batch]
    
    SaveProgress --> End1([Pause])
    SubmitBatch --> ValidateData[Validate:<br/>• Duplicate check<br/>• Required fields<br/>• Negative qty check]
    
    ValidateData --> ValidationOK{Valid?}
    
    ValidationOK -->|Có lỗi| ShowErrors[❌ Hiển thị errors<br/>Fix required]
    ValidationOK -->|OK| SubmitServer[Submit to server]
    
    ShowErrors --> ContinueOption
    
    SubmitServer --> ServerSave[Server save<br/>to database]
    
    ServerSave --> NotifyManager[📧 Notify Manager:<br/>Team A submitted<br/>25/50 items]
    
    NotifyManager --> End2([Hoàn tất batch])
    
    style Start fill:#e1f5e1
    style End1 fill:#FFE4B5
    style End2 fill:#90EE90
    style UnknownBarcode fill:#FFB6C1
    style FeedbackSuccess fill:#90EE90
    style QuickMode fill:#87CEEB
```

## 6. Variance Analysis Dashboard

```mermaid
graph TB
    subgraph Report["📊 Variance Analysis Report"]
        Summary["Summary Statistics"]
        Products["Products Detail"]
        Financial["Financial Impact"]
        Team["Team Performance"]
    end
    
    subgraph Summary
        Total["Total Items Counted: 100"]
        Accurate["✅ Accurate 0%: 75 items"]
        LowVar["⚠️ Low Variance <5%: 15 items"]
        MedVar["🟡 Medium 5-10%: 7 items"]
        HighVar["🔴 High >10%: 3 items"]
        AccuracyRate["Accuracy Rate: 90%"]
    end
    
    subgraph Products
        P1["Rouge Dior 999<br/>Sys: 67 | Act: 65<br/>Var: -2 -3%<br/>Status: ✅ Approved"]
        P2["Estée Lauder<br/>Sys: 45 | Act: 42<br/>Var: -3 -6.7%<br/>Status: ⏳ Pending"]
        P3["La Roche-Posay<br/>Sys: 52 | Act: 43<br/>Var: -9 -17.3%<br/>Status: 🚨 Investigation"]
    end
    
    subgraph Financial
        TotalValue["Total Inventory Value<br/>System: 450M VND<br/>Actual: 445M VND"]
        Variance["Variance: -5M VND -1.1%"]
        Loss["Potential Loss: 5M"]
    end
    
    subgraph Team
        TeamA["Team A<br/>50 items | 98% accuracy<br/>Time: 2.5h"]
        TeamB["Team B<br/>50 items | 94% accuracy<br/>Time: 3h"]
        TopPerformer["🏆 Top: Team A"]
    end
    
    style Report fill:#f0f0f0
    style Accurate fill:#d4edda
    style HighVar fill:#f8d7da
    style P3 fill:#f8d7da
```

---

## Giải Thích Các Diagrams

### 1. Basic Stock Take Process
- Quy trình cơ bản từ tạo phiên → đếm → approve → update
- Bao gồm: manual count, import, export sheet, save draft
- Happy path + rejection path

### 2. Enhanced Stock Take (7 Features)
- Full workflow với tất cả 7 tính năng mới
- Cycle count vs Full count
- Freeze inventory options
- Team assignment & parallel counting
- Barcode scanning
- Partial submission
- 3-tier approval workflow

### 3. Approval Workflow Detail
- Chi tiết 3 levels: Auto / Supervisor / Manager
- Investigation report requirement
- Escalation path
- Database updates

### 4. Team-based Sequence
- Timeline của multi-team stock take
- Parallel counting
- Progress tracking
- Approval workflow
- Notifications

### 5. Barcode Scanning Flow
- Quick scan vs Manual mode
- Lookup → Update → Feedback
- Error handling (unknown barcode)
- Progress tracking
- Submit batch

### 6. Variance Analysis Dashboard
- Visual representation của báo cáo
- Summary statistics
- Product details
- Financial impact
- Team performance

---

## Color Legend

- 🟢 **Xanh lá** (#e1f5e1, #90EE90): Success, completed, approved
- 🟡 **Vàng** (#FFD700, #FFE4B5): In progress, warning, saved draft
- 🔴 **Đỏ** (#FFB6C1, #FF6347): Error, rejected, high variance
- 🔵 **Xanh dương** (#87CEEB): Special features (barcode scan)
- ⚪ **Xám** (#f0f0f0): Neutral, informational
