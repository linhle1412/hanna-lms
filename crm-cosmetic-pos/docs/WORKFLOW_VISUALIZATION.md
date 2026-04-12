# CRM Cosmetic POS - BA Workflow Visualization

## 1. Overall BA Workflow

```mermaid
graph TB
    Start([BA nhận yêu cầu:<br/>Làm màn hình X]) --> CheckCRUD[CRUD Scope Discovery<br/>5 câu hỏi bắt buộc]
    
    CheckCRUD --> Q1[1. CREATE?<br/>A/B/C]
    Q1 --> Q2[2. READ?<br/>A/B/C]
    Q2 --> Q3[3. UPDATE?<br/>A/B/C]
    Q3 --> Q4[4. DELETE?<br/>A/B/C]
    Q4 --> Q5[5. SPECIAL ACTIONS?<br/>List them]
    
    Q5 --> Layout{Quyết định Layout}
    
    Layout -->|List + Detail| SingleCol[Single Column<br/>Table + Modal]
    Layout -->|Create Form<br/>Simple| SingleForm[Single Column<br/>Form]
    Layout -->|Create Form<br/>Complex| TwoCol[2 Columns<br/>Left: Forms<br/>Right: Cart/Summary]
    
    SingleCol --> DummyData[Tạo Dummy Data<br/>Vietnamese realistic]
    SingleForm --> DummyData
    TwoCol --> DummyData
    
    DummyData --> Confirm{BA Approve<br/>Outline?}
    Confirm -->|No| Layout
    Confirm -->|Yes| CreateHTML[Tạo HTML Prototype]
    
    CreateHTML --> UpdateNav[Update Navigation<br/>Sidebar + Breadcrumb]
    UpdateNav --> Test[Test in Browser]
    
    Test --> TestOK{Layout OK?}
    TestOK -->|No| Fix[Fix CSS/Structure]
    Fix --> Test
    TestOK -->|Yes| WriteFeatures[Viết features-[X].md]
    
    WriteFeatures --> Review{BA Review<br/>Features?}
    Review -->|Need changes| WriteFeatures
    Review -->|Approved| NextScreen{Làm màn hình<br/>tiếp theo?}
    
    NextScreen -->|Yes| Start
    NextScreen -->|No| Done([Hoàn thành])
    
    style Start fill:#e3f2fd
    style Done fill:#c8e6c9
    style CheckCRUD fill:#fff3e0
    style Confirm fill:#ffe0b2
    style TestOK fill:#ffe0b2
    style Review fill:#ffe0b2
```

## 2. CRUD Decision Tree

```mermaid
graph LR
    Screen[Màn hình mới] --> Create{CREATE?}
    
    Create -->|Yes - Form riêng| CreatePage[Tạo create-[x].html<br/>2-column layout]
    Create -->|Yes - Modal| CreateModal[Add modal vào list screen]
    Create -->|No| ReadOnly[Read-only screen]
    
    CreatePage --> Read{READ?}
    CreateModal --> Read
    ReadOnly --> Read
    
    Read -->|List only| ListScreen[Table view<br/>+ Filters]
    Read -->|Detail only| DetailScreen[Detail page/<br/>Modal]
    Read -->|Both| ListDetail[Table + Detail<br/>Modal popup]
    
    ListScreen --> Update{UPDATE?}
    DetailScreen --> Update
    ListDetail --> Update
    
    Update -->|Full edit| EditForm[Edit form/<br/>modal]
    Update -->|Partial| InlineEdit[Inline editing<br/>cells]
    Update -->|No| NoEdit[View only]
    
    EditForm --> Delete{DELETE?}
    InlineEdit --> Delete
    NoEdit --> Delete
    
    Delete -->|Hard delete| ConfirmDel[Confirm dialog<br/>+ Delete API]
    Delete -->|Soft delete| SoftDel[Status = inactive]
    Delete -->|No| NoDelete[No delete action]
    
    style CreatePage fill:#bbdefb
    style ListDetail fill:#c5e1a5
    style EditForm fill:#fff9c4
    style ConfirmDel fill:#ffccbc
```

## 3. File Structure & Flow

```mermaid
graph TB
    subgraph "📁 Project Structure"
        Project[crm-cosmetic-pos/]
        
        Project --> HTML[📄 HTML Files]
        Project --> CSS[🎨 CSS Files]
        Project --> Docs[📋 Docs]
        
        HTML --> POS[index.html<br/>POS - Bán hàng]
        HTML --> Orders[orders.html<br/>Danh sách đơn]
        HTML --> CreateOrder[create-order.html<br/>Tạo đơn thủ công]
        HTML --> Customers[customers.html<br/>Future]
        
        CSS --> StylesCSS[css/styles.css<br/>Global variables]
        CSS --> CommonCSS[css/common.css<br/>Sidebar, tables, badges]
        
        Docs --> Features[docs/features-*.md<br/>Feature lists]
        Docs --> Workflow[docs/BA-WORKFLOW-*.md<br/>Process guides]
    end
    
    subgraph "🔗 Navigation Flow"
        SidebarMenu[Sidebar Menu] --> POSNav[POS - Bán Hàng]
        SidebarMenu --> OrdersNav[Đơn Hàng]
        
        OrdersNav --> OrdersList[orders.html]
        OrdersList -->|Click Tạo đơn hàng| CreateForm[create-order.html]
        CreateForm -->|Breadcrumb| OrdersList
        CreateForm -->|Hủy button| OrdersList
        CreateForm -->|Tạo đơn success| OrdersList
    end
    
    style POS fill:#bbdefb
    style Orders fill:#c5e1a5
    style CreateOrder fill:#fff9c4
```

## 4. Screen Layout Patterns

```mermaid
graph TB
    subgraph "Pattern 1: List + Detail (orders.html)"
        P1[app-layout] --> P1Sidebar[Sidebar]
        P1 --> P1Main[main-content]
        P1Main --> P1Header[page-header<br/>+ Tạo đơn button]
        P1Main --> P1Content[page-content]
        P1Content --> P1Stats[Stats cards<br/>4 KPIs]
        P1Content --> P1Filters[Filters<br/>Search + Status + Date]
        P1Content --> P1Table[data-table<br/>Order list]
        P1Table -->|Click 👁️| P1Modal[Detail Modal]
    end
    
    subgraph "Pattern 2: 2-Column Form (create-order.html)"
        P2[app-layout] --> P2Sidebar[Sidebar]
        P2 --> P2Main[main-content]
        P2Main --> P2Breadcrumb[breadcrumb-section]
        P2Main --> P2Header[page-header]
        P2Main --> P2Grid[create-order-grid<br/>2 columns]
        P2Grid --> P2Left[left-column<br/>Scrollable]
        P2Grid --> P2Right[right-column<br/>Fixed height]
        
        P2Left --> P2Form1[Customer Info]
        P2Left --> P2Form2[Product Search]
        P2Left --> P2Form3[Discount & Promo]
        P2Left --> P2Form4[Shipping]
        P2Left --> P2Form5[Payment]
        
        P2Right --> P2Cart[Cart Items]
        P2Right --> P2Summary[Order Summary]
        P2Right --> P2Actions[Action Buttons]
    end
    
    subgraph "Pattern 3: POS Layout (index.html)"
        P3[app-layout] --> P3Sidebar[Sidebar]
        P3 --> P3Main[main-content]
        P3Main --> P3Header[page-header]
        P3Main --> P3Grid[pos-main<br/>2 columns 1.2fr 1fr]
        P3Grid --> P3Products[Left: Products<br/>Search + Grid + Categories]
        P3Grid --> P3Cart[Right: Cart<br/>Items + Customer + Payment]
    end
    
    style P1Table fill:#bbdefb
    style P2Grid fill:#c5e1a5
    style P3Grid fill:#fff9c4
```

## 5. Feature Writing Process

```mermaid
sequenceDiagram
    participant BA as BA (You)
    participant Agent as AI Agent
    participant HTML as HTML Prototype
    participant MD as features-*.md
    
    BA->>Agent: "Làm màn hình Orders"
    Agent->>BA: Ask CRUD questions (1-5)
    BA->>Agent: Answer (e.g. C, C, C, C, Export)
    
    Agent->>Agent: Decide layout<br/>(List + Detail)
    Agent->>BA: "Tôi sẽ tạo orders.html với..."<br/>Confirm?
    BA->>Agent: "Yes"
    
    Agent->>HTML: Create orders.html
    HTML-->>Agent: File created
    
    Agent->>BA: "Test in browser!"
    BA->>HTML: Open & review
    
    alt Layout OK
        BA->>Agent: "OK"
        Agent->>BA: "Viết features-orders.md?"
        BA->>Agent: "Yes"
        
        Agent->>MD: Write features list<br/>Use Cases, Rules, Logic
        MD-->>Agent: File created
        
        Agent->>BA: "Review features?"
        BA->>MD: Read & review
        
        alt Features OK
            BA->>Agent: "Approved ✅"
            Agent->>BA: "Next screen?"
        else Need changes
            BA->>Agent: "Sửa [X]"
            Agent->>MD: Update file
        end
    else Layout broken
        BA->>Agent: "Layout lỗi"
        Agent->>HTML: Fix CSS/Structure
        Agent->>BA: "Reload & test"
    end
```

## 6. Agent Skill Trigger

```mermaid
flowchart LR
    UserMsg[User message] --> CheckTrigger{Contains<br/>trigger words?}
    
    CheckTrigger -->|"Làm màn hình"| Skill
    CheckTrigger -->|"Vẽ prototype"| Skill
    CheckTrigger -->|"Tạo HTML"| Skill
    CheckTrigger -->|"Viết features"| Skill
    CheckTrigger -->|Other| Normal[Normal response]
    
    Skill[Load ba-html-prototype<br/>SKILL.md] --> ReadSkill[Read workflow steps]
    ReadSkill --> ApplyStep1[Step 1: CRUD Discovery]
    ApplyStep1 --> ApplyStep2[Step 2: Layout Decision]
    ApplyStep2 --> ApplyStep3[Step 3: Dummy Data]
    ApplyStep3 --> ApplyStep4[Step 4: Create HTML]
    ApplyStep4 --> ApplyStep5[Step 5: Update Nav]
    ApplyStep5 --> ApplyStep6[Step 6: Confirm]
    ApplyStep6 --> Done[Deliver prototype]
    
    style Skill fill:#ffe0b2
    style Done fill:#c8e6c9
```

## 7. Data Flow: From Prototype to Features Doc

```mermaid
graph LR
    subgraph "HTML Prototype"
        H1[Customer form<br/>fields]
        H2[Product search<br/>UI]
        H3[Cart display<br/>structure]
        H4[Payment<br/>methods]
        H5[Summary<br/>calculation]
    end
    
    subgraph "features-*.md"
        F1[Use Cases<br/>Real scenarios]
        F2[Business Rules<br/>Validation, Flow]
        F3[Features List<br/>F1, F2, F3...]
        F4[Data Model<br/>Tables, Fields]
        F5[Logic<br/>Formulas, Flow]
    end
    
    H1 --> F1
    H1 --> F2
    H1 --> F4
    
    H2 --> F3
    H3 --> F3
    H4 --> F3
    
    H5 --> F5
    H5 --> F2
    
    F1 --> Dev[Hand off to Dev]
    F2 --> Dev
    F3 --> Dev
    F4 --> Dev
    F5 --> Dev
    
    style Dev fill:#c8e6c9
```

## Summary

This workflow ensures:
- ✅ **Completeness**: CRUD checklist catches missing features
- ✅ **Consistency**: All screens follow same patterns
- ✅ **Speed**: Reusable templates & CSS
- ✅ **Quality**: Realistic dummy data & real use cases
- ✅ **Traceability**: HTML → Features doc → Dev handoff

**Current Status:** 3 screens completed (POS, Orders List, Create Order)
