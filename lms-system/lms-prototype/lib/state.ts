// LMS State Management System - TypeScript version
export interface Module {
  id: number;
  name: string;
  duration: number; // in hours
  outcome: string;
  tags?: string[];
  status: string; // ACTIVE, INACTIVE, DRAFT
  createdBy: string;
  updatedBy?: string;
  createdDate: string;
  updatedDate?: string;
  files?: Array<{
    id: string;
    fileName: string;
    fileSize: number; // in bytes
    fileType: string;
    uploadedBy: string;
    uploadDate: string;
  }>;
  usageCount?: number; // Number of products using this module
}

export interface Program {
  id: number;
  name: string;
  description?: string;
  type: string; // SHINE, Product, Skill
  licenseType: string;
  duration: number; // in days
  maxParticipant?: number;
  status: string; // ACTIVE, INACTIVE
  createdDate?: string;
  updatedDate?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  type: string; // Skill, Product
  learnerType?: string;
  license?: string;
  duration: number; // in hours (auto-calculated from sessions)
  code?: string;
  certificate?: string;
  tags?: string[];
  status: string; // ACTIVE, INACTIVE, DRAFT
  createdBy: string;
  createdDate: string;
  updatedBy?: string;
  updatedDate?: string;
  sessions: Array<{
    sessionId: number;
    sessionName: string;
    description?: string;
    fileName?: string;
    moduleId: number;
    moduleName?: string;
    moduleDuration?: number;
    sequence: number;
  }>;
  files?: Array<{
    fileId: string;
    fileName: string;
    fileSize: number; // in bytes
    fileType: string;
    uploadedBy: string;
    uploadDate: string;
  }>;
  usageCount?: number; // Number of programs using this product
}

export interface Course {
  id: number;
  code: string;
  name: string;
  program: string;
  trainer: string;
  channel: string;
  region: string;
  status: string;
  startDate: string;
  endDate: string;
  venue: string;
  section?: number;
  createdBy: string;
  createdAt?: string; // ISO datetime string
  participantIds: number[];
  statusHistory?: Array<{
    status: string;
    timestamp: string; // ISO datetime string
    performedBy: string; // User name and role, or "System"
    action?: string;
    reason?: string;
    previousStatus?: string;
    isAutomatic?: boolean;
  }>;
  // Extended fields
  courseType?: string;
  licenseType?: string;
  partner?: string[];
  branch?: string | string[]; // Can be string (new format) or array (backward compatibility)
  primaryTrainer?: string;
  coTrainer?: string;
  venueAddress?: string;
  area?: string;
  province?: string;
  startTimePeriod?: string;
  endTimePeriod?: string;
  description?: string;
  aolStartTime?: string;
  aolEndTime?: string;
  aolExamId?: string[];
  mofCourseName?: string;
  examType?: string;
  mofExamTime?: string;
  isProctorTrainer?: boolean;
  proctorTrainer?: string;
  proctorName?: string;
  proctorPhone?: string;
  mofAddress?: string;
  mofProvince?: string;
  ward?: string;  // Updated: District removed (Vietnam admin reform July 2025)
  examCategory?: string;
  mofExamCode?: string;  // MOF exam code entered in checklist
  supporter?: string[];
  checklistTemplateId?: string;
}

// Reminder Recipient Types
export interface ReminderRecipient {
  type: 'email' | 'channel' | 'region' | 'user'
  value: string // email address, channel name, region name, or user ID
  label?: string // Display label
  userId?: number // User ID (for type 'user')
  userEmail?: string // User email (for type 'user', for convenience)
}

// Status Definition Logic Types
export type StatusDefinitionType = 
  | 'manual_confirm'           // PIC confirms manually
  | 'field_check'              // System checks if field has value
  | 'course_status_change'    // Automatic when course status changes
  | 'percentage_calculation'   // Automatic calculation based on data
  | 'action_tracked'          // System tracks user action (button click)
  | 'api_integration'         // Automatic via API callback

export interface StatusDefinitionLogic {
  type: StatusDefinitionType
  description: string // Human-readable description (current statusDefinitionLogic text)
  
  // For 'field_check' type
  fieldCheck?: {
    fieldPath: string // e.g., 'mofExamCode', 'course.status'
    condition: 'not_empty' | 'equals' | 'greater_than' | 'less_than'
    value?: any // Required for equals/greater_than/less_than
  }
  
  // For 'course_status_change' type
  statusChange?: {
    targetStatus: string // e.g., 'Approved', 'Finished'
  }
  
  // For 'percentage_calculation' type
  percentageCalculation?: {
    numerator: string // e.g., 'participantIds.length'
    denominator: string // e.g., 'program.maxParticipants || 50'
    threshold?: number // Optional: mark done when percentage >= threshold
  }
  
  // For 'action_tracked' type
  actionTracked?: {
    actionType: string // e.g., 'export', 'import', 'confirm'
    requiresSuccess?: boolean // Whether action must succeed
  }
  
  // For 'api_integration' type
  apiIntegration?: {
    endpoint: string
    eventType: string // e.g., 'aol_results_received', 'attendance_updated'
    condition?: string // Optional condition to check
  }
}

// Checklist Template Types
export interface ChecklistStep {
  id: number
  name: string
  description?: string
  order: number
  pic: string // Person in Charge role
  reminderTiming?: {
    type: 'none' | 'daily' | 'date_based' | 'course_date_relative'
    start?: string // 'course_creation' | 'course_start' | 'course_end' | date
    end?: string
    frequency?: 'daily' | 'weekly'
    daysBefore?: number
    daysAfter?: number
  }
  reminderTemplate?: string
  additionalEmails?: string[] // Deprecated: Use reminderRecipients instead
  reminderRecipients?: ReminderRecipient[] // New: Supports email, channel, region
  actionType: 'confirm' | 'approve' | 'export' | 'import' | 'enter_data' | 'finish' | 'none'
  statusDefinitionLogic: string // Text-based description (for backward compatibility)
  structuredStatusLogic?: StatusDefinitionLogic // Structured logic for automatic evaluation
  isActive: boolean
  isCustom?: boolean // True for custom actions added to course instances
}

export interface ChecklistTemplate {
  id: string
  name: string
  description?: string
  courseType: 'SHINE' | 'Product' | 'Skill'
  steps: ChecklistStep[]
  isDefault: boolean
  isActive: boolean
  createdBy?: string
  createdDate?: string
  updatedBy?: string
  updatedDate?: string
}

// Course Checklist Instance (actual checklist for a specific course)
export interface CourseChecklistStepInstance {
  stepId: number // References ChecklistStep.id from template (or custom step ID for custom actions)
  name: string
  description?: string
  order: number
  pic: string
  actionType: 'confirm' | 'approve' | 'export' | 'import' | 'enter_data' | 'finish' | 'none'
  status: 'not_started' | 'pending' | 'done' | 'overdue' | 'not_applicable'
  completedAt?: string // ISO datetime
  completedBy?: string // User who completed the step
  reminderSentAt?: string // Last reminder sent timestamp
  notes?: string
  reminderTiming?: ChecklistStep['reminderTiming']
  additionalEmails?: string[] // Deprecated: Use reminderRecipients instead
  reminderRecipients?: ReminderRecipient[] // New: Supports email, channel, region
  isCustom?: boolean // True for custom actions added to course instances
  manualMarkDoneReason?: string // Reason provided when admin manually marks step as done
  manualMarkDoneBy?: string // Admin who manually marked step as done
  autoDetectedAt?: string // Timestamp when automatically detected
  autoDetectionReason?: string // Reason for automatic detection
  lastEvaluatedAt?: string // Last time status was evaluated
}

export interface CourseChecklistInstance {
  id: string // Unique ID for this checklist instance
  courseId: number
  templateId: string // References ChecklistTemplate.id
  templateName: string
  steps: CourseChecklistStepInstance[]
  customActions?: CourseChecklistStepInstance[] // Custom actions added by Admin
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface Participant {
  id: number;
  name: string;
  agentCode: string;
  email: string;
  phone: string;
  region: string;
  channel: string;
  status: string;
}

export interface Trainer {
  id: number;
  fullName: string;
  trainerTitle: string; // Head Academy, Head Agency, Head Banca, Head IFA
  gender: string; // Male/Female/Other
  idNumber: string;
  issueDate: string;
  issuePlace: string;
  email: string;
  phone: string;
  trainerRate: number;
  highestDegree: string;
  degree: string; // Associate/Bachelor's/Master's/Doctoral
  trainerType: string; // FWD/FWT
  location: string;
  region: string; // South/Middle/North
  status: string; // Active/Inactive
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  // Additional sections (for details page)
  address?: Array<{
    type: string;
    street: string;
    province: string;
    ward: string;
    country: string;
  }>;
  experiences?: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
  }>;
  rewards?: Array<{
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
  }>;
  activeRatio?: {
    totalCourses: number;
    completedCourses: number;
    averageRating: number;
  };
  trainingHistory?: Array<{
    courseId: number;
    courseName: string;
    courseDate: string;
    participants: number;
  }>;
}

export interface User {
  id: number;
  username: string;
  password?: string; // Optional for security (not returned in API responses)
  email: string;
  roles: string[];
  team: string;
  channel?: string; // Agency, Banca, IFA, Banker
  region?: string; // South, Middle, North, Central
  createdDate: string;
}

class LMSStateManager {
  modules: Module[] = [];
  products: Product[] = [];
  courses: Course[] = [];
  participants: Participant[] = [];
  trainers: Trainer[] = [];
  users: User[] = [];
  private listeners: { [key: string]: (() => void)[] } = {};

  init() {
    // Check if data exists in localStorage (client-side only)
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('lms_modules')) {
        this.modules = JSON.parse(localStorage.getItem('lms_modules')!);
      } else {
        this.modules = this.getDefaultModules();
        this.save('modules');
      }

      if (localStorage.getItem('lms_products')) {
        this.products = JSON.parse(localStorage.getItem('lms_products')!);
      } else {
        this.products = this.getDefaultProducts();
        this.save('products');
      }

      if (localStorage.getItem('lms_courses')) {
        this.courses = JSON.parse(localStorage.getItem('lms_courses')!);
      } else {
        this.courses = this.getDefaultCourses();
        this.save('courses');
      }

      if (localStorage.getItem('lms_participants')) {
        this.participants = JSON.parse(localStorage.getItem('lms_participants')!);
      } else {
        this.participants = this.getDefaultParticipants();
        this.save('participants');
      }

      if (localStorage.getItem('lms_trainers')) {
        this.trainers = JSON.parse(localStorage.getItem('lms_trainers')!);
      } else {
        this.trainers = this.getDefaultTrainers();
        this.save('trainers');
      }

      if (localStorage.getItem('lms_users')) {
        this.users = JSON.parse(localStorage.getItem('lms_users')!);
      } else {
        this.users = this.getDefaultUsers();
        this.save('users');
      }
    }
  }

  async loadMockData() {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/data/courses.json');
      const data = await response.json();
      this.courses = data;
      this.save('courses');
    } catch {
      this.courses = this.getDefaultCourses();
      this.save('courses');
    }
  }

  async loadMockParticipants() {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/data/participants.json');
      const data = await response.json();
      this.participants = data;
      this.save('participants');
    } catch {
      this.participants = this.getDefaultParticipants();
      this.save('participants');
    }
  }

  async loadMockTrainers() {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/data/trainers.json');
      const data = await response.json();
      this.trainers = data;
      this.save('trainers');
    } catch {
      this.trainers = this.getDefaultTrainers();
      this.save('trainers');
    }
  }

  async loadMockUsers() {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/data/users.json');
      const data = await response.json();
      this.users = data;
      this.save('users');
    } catch {
      this.users = this.getDefaultUsers();
      this.save('users');
    }
  }

  getDefaultModules(): Module[] {
    return [
      {
        id: 1,
        name: 'Introduction to Life Insurance',
        duration: 2.5,
        outcome: 'Understand basic life insurance concepts, types of policies, and regulatory requirements',
        tags: ['Insurance', 'Basics', 'Foundation'],
        status: 'ACTIVE',
        createdBy: 'System',
        createdDate: '2025-01-15',
        files: [],
        usageCount: 0
      },
      {
        id: 2,
        name: 'Sales Techniques for Insurance',
        duration: 3,
        outcome: 'Master effective sales techniques, customer engagement strategies, and closing methods',
        tags: ['Sales', 'Skills', 'Communication'],
        status: 'ACTIVE',
        createdBy: 'System',
        createdDate: '2025-01-15',
        files: [],
        usageCount: 0
      },
      {
        id: 3,
        name: 'Regulatory Compliance',
        duration: 2,
        outcome: 'Understand insurance regulations, compliance requirements, and ethical practices',
        tags: ['Compliance', 'Legal', 'Ethics'],
        status: 'ACTIVE',
        createdBy: 'System',
        createdDate: '2025-01-15',
        files: [],
        usageCount: 0
      },
      {
        id: 4,
        name: 'Customer Service Excellence',
        duration: 1.5,
        outcome: 'Develop customer service skills, handle complaints effectively, and build long-term relationships',
        tags: ['Customer Service', 'Skills', 'Communication'],
        status: 'ACTIVE',
        createdBy: 'System',
        createdDate: '2025-01-15',
        files: [],
        usageCount: 0
      },
      {
        id: 5,
        name: 'Digital Marketing for Insurance',
        duration: 2,
        outcome: 'Learn digital marketing strategies, social media engagement, and online lead generation',
        tags: ['Marketing', 'Digital', 'Social Media'],
        status: 'DRAFT',
        createdBy: 'System',
        createdDate: '2025-01-20',
        files: [],
        usageCount: 0
      }
    ];
  }

  getDefaultCourses(): Course[] {
    return [
      {
        id: 1,
        code: '4-TPCTIFA_M... Shine',
        name: 'Shine: New course',
        program: 'SHINE Program',
        trainer: 'Trainer1 cloudair',
        channel: 'IFA',
        region: 'IFA Central',
        status: 'Creating',
        startDate: '2025-10-01',
        endDate: '2025-10-16',
        venue: 'NA',
        section: 3,
        createdBy: 'LMS Admin Cloudair',
        participantIds: [1, 2]
      },
      {
        id: 2,
        code: '3-KGNF_SOU... Product',
        name: '2-TPCTAG_SOUTH-Shine',
        program: 'Product Program',
        trainer: 'trainer 2 cloudair',
        channel: 'Banca',
        region: 'Banca South',
        status: 'Creating',
        startDate: '2025-10-01',
        endDate: '2025-10-16',
        venue: 'NA',
        section: 4,
        createdBy: 'LMS Admin Cloudair',
        participantIds: []
      }
    ];
  }

  getDefaultParticipants(): Participant[] {
    return [
      {
        id: 1,
        name: 'John Doe',
        agentCode: 'AGT001',
        email: 'john@mail.com',
        phone: '123-456-7890',
        region: 'IFA Central',
        channel: 'IFA',
        status: 'Active'
      },
      {
        id: 2,
        name: 'Jane Smith',
        agentCode: 'AGT002',
        email: 'jane@mail.com',
        phone: '234-567-8901',
        region: 'Banca South',
        channel: 'Banca',
        status: 'Active'
      },
      {
        id: 3,
        name: 'Bob Wilson',
        agentCode: 'AGT003',
        email: 'bob@mail.com',
        phone: '345-678-9012',
        region: 'Agency South',
        channel: 'Agency',
        status: 'Active'
      }
    ];
  }

  getDefaultTrainers(): Trainer[] {
    return [
      {
        id: 1,
        fullName: 'Trainer1 cloudair',
        trainerTitle: 'Head Academy',
        gender: 'Male',
        idNumber: '123456789',
        issueDate: '2020-01-15',
        issuePlace: 'Ho Chi Minh',
        email: 'trainer1@mail.com',
        phone: '0901234567',
        trainerRate: 50,
        highestDegree: 'Master of Business Administration',
        degree: "Master's",
        trainerType: 'FWD',
        location: 'Ho Chi Minh City',
        region: 'South',
        status: 'Active',
        createdBy: 'System',
        createdDate: '2025-01-01'
      },
      {
        id: 2,
        fullName: 'Trainer2 cloudair',
        trainerTitle: 'Head Agency',
        gender: 'Female',
        idNumber: '987654321',
        issueDate: '2019-05-20',
        issuePlace: 'Hanoi',
        email: 'trainer2@mail.com',
        phone: '0912345678',
        trainerRate: 55,
        highestDegree: 'Bachelor of Education',
        degree: "Bachelor's",
        trainerType: 'FWD',
        location: 'Hanoi',
        region: 'North',
        status: 'Active',
        createdBy: 'System',
        createdDate: '2025-01-01'
      }
    ];
  }

  getDefaultUsers(): User[] {
    return [
      {
        id: 1,
        username: 'Head_agency',
        email: 'head.agency@fwd.com',
        roles: ['HEAD_CHANNEL', 'LEAD_REGION'],
        team: 'Admin',
        createdDate: '2025-09-01'
      }
    ];
  }

  save(type: 'modules' | 'products' | 'courses' | 'participants' | 'trainers' | 'users') {
    if (typeof window === 'undefined') return;
    
    const key = `lms_${type}`;
    const data = this[type];
    localStorage.setItem(key, JSON.stringify(data));
    this.dispatchEvent(`${type}_updated`);
  }

  saveAll() {
    this.save('modules');
    this.save('products');
    this.save('courses');
    this.save('participants');
    this.save('trainers');
    this.save('users');
  }

  on(event: string, callback: () => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  dispatchEvent(event: string) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback());
    }
  }

  // Module CRUD
  getModule(id: number): Module | undefined {
    return this.modules.find(m => m.id === id);
  }

  getModules(filters: { status?: string; search?: string; duration?: string } = {}): Module[] {
    let filtered = [...this.modules];

    if (filters.status) {
      filtered = filtered.filter(m => m.status === filters.status);
    }
    if (filters.duration) {
      if (filters.duration === '<2') {
        filtered = filtered.filter(m => m.duration < 2);
      } else if (filters.duration === '2-4') {
        filtered = filtered.filter(m => m.duration >= 2 && m.duration <= 4);
      } else if (filters.duration === '>4') {
        filtered = filtered.filter(m => m.duration > 4);
      }
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(search) ||
        m.outcome.toLowerCase().includes(search) ||
        (m.tags && m.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }

    return filtered;
  }

  createModule(moduleData: Partial<Module>): Module {
    const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
    const newModule: Module = {
      id: Date.now(),
      name: moduleData.name || '',
      duration: moduleData.duration || 0,
      outcome: moduleData.outcome || '',
      tags: moduleData.tags || [],
      status: moduleData.status || 'DRAFT',
      createdBy: currentUser,
      createdDate: new Date().toISOString().split('T')[0],
      files: moduleData.files || [],
      usageCount: 0
    };
    this.modules.push(newModule);
    this.save('modules');
    return newModule;
  }

  updateModule(id: number, updates: Partial<Module>): Module | null {
    const index = this.modules.findIndex(m => m.id === id);
    if (index !== -1) {
      const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
      this.modules[index] = { 
        ...this.modules[index], 
        ...updates,
        updatedBy: currentUser,
        updatedDate: new Date().toISOString().split('T')[0]
      };
      this.save('modules');
      return this.modules[index];
    }
    return null;
  }

  deleteModule(id: number): boolean {
    const index = this.modules.findIndex(m => m.id === id);
    if (index !== -1) {
      this.modules.splice(index, 1);
      this.save('modules');
      return true;
    }
    return false;
  }

  cloneModule(id: number, newName: string, options: { copyFiles?: boolean; copyTags?: boolean; setDraft?: boolean } = {}): Module | null {
    const sourceModule = this.getModule(id);
    if (!sourceModule) return null;

    const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
    const clonedModule: Module = {
      id: Date.now(),
      name: newName,
      duration: sourceModule.duration,
      outcome: sourceModule.outcome,
      tags: options.copyTags ? [...(sourceModule.tags || [])] : [],
      status: options.setDraft ? 'DRAFT' : sourceModule.status,
      createdBy: currentUser,
      createdDate: new Date().toISOString().split('T')[0],
      files: options.copyFiles ? [...(sourceModule.files || [])] : [],
      usageCount: 0
    };
    this.modules.push(clonedModule);
    this.save('modules');
    return clonedModule;
  }

  // Product CRUD
  getProduct(id: number): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  getProducts(filters: { type?: string; status?: string; search?: string; tags?: string[] } = {}): Product[] {
    let filtered = [...this.products];

    if (filters.type && filters.type !== 'All') {
      filtered = filtered.filter(p => p.type === filters.type);
    }
    if (filters.status && filters.status !== 'All') {
      filtered = filtered.filter(p => p.status === filters.status);
    }
    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(p => 
        p.tags && p.tags.some(tag => filters.tags!.includes(tag))
      );
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        (p.description && p.description.toLowerCase().includes(search)) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(search)))
      );
    }

    return filtered;
  }

  createProduct(productData: Partial<Product>): Product {
    const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
    
    // Calculate duration from sessions
    const duration = productData.sessions?.reduce((total, session) => 
      total + (session.moduleDuration || 0), 0
    ) || 0;

    const newProduct: Product = {
      id: Date.now(),
      name: productData.name || '',
      description: productData.description,
      type: productData.type || 'Product',
      learnerType: productData.learnerType,
      license: productData.license,
      duration,
      code: productData.code,
      certificate: productData.certificate,
      tags: productData.tags || [],
      status: productData.status || 'DRAFT',
      createdBy: currentUser,
      createdDate: new Date().toISOString().split('T')[0],
      sessions: productData.sessions || [],
      files: productData.files || [],
      usageCount: 0
    };
    this.products.push(newProduct);
    this.save('products');
    return newProduct;
  }

  updateProduct(id: number, updates: Partial<Product>): Product | null {
    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
      
      // Recalculate duration if sessions changed
      let duration = this.products[index].duration;
      if (updates.sessions) {
        duration = updates.sessions.reduce((total, session) => 
          total + (session.moduleDuration || 0), 0
        );
      }

      this.products[index] = { 
        ...this.products[index], 
        ...updates,
        duration,
        updatedBy: currentUser,
        updatedDate: new Date().toISOString().split('T')[0]
      };
      this.save('products');
      return this.products[index];
    }
    return null;
  }

  deleteProduct(id: number): boolean {
    const product = this.getProduct(id);
    if (!product) return false;
    
    // Check if product is used in any programs
    if (product.usageCount && product.usageCount > 0) {
      return false;
    }

    const index = this.products.findIndex(p => p.id === id);
    if (index !== -1) {
      this.products.splice(index, 1);
      this.save('products');
      return true;
    }
    return false;
  }

  cloneProduct(id: number, newName: string, options: { copySessions?: boolean; copyTags?: boolean; copyFiles?: boolean; setDraft?: boolean } = {}): Product | null {
    const sourceProduct = this.getProduct(id);
    if (!sourceProduct) return null;

    const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
    const clonedProduct: Product = {
      id: Date.now(),
      name: newName,
      description: sourceProduct.description,
      type: sourceProduct.type,
      learnerType: sourceProduct.learnerType,
      license: sourceProduct.license,
      duration: options.copySessions ? sourceProduct.duration : 0,
      code: undefined, // Don't copy code (must be unique)
      certificate: sourceProduct.certificate,
      tags: options.copyTags ? [...(sourceProduct.tags || [])] : [],
      status: options.setDraft ? 'DRAFT' : sourceProduct.status,
      createdBy: currentUser,
      createdDate: new Date().toISOString().split('T')[0],
      sessions: options.copySessions ? sourceProduct.sessions.map(s => ({...s, sessionId: Date.now() + Math.random()})) : [],
      files: options.copyFiles ? [...(sourceProduct.files || [])] : [],
      usageCount: 0
    };
    this.products.push(clonedProduct);
    this.save('products');
    return clonedProduct;
  }

  getDefaultProducts(): Product[] {
    return [
      {
        id: 1,
        name: "Product Knowledge Fundamentals",
        description: "Comprehensive overview of product features and benefits for new sales representatives",
        type: "Product",
        learnerType: "Beginner",
        license: "Product Training License",
        duration: 16,
        code: "PROD-001",
        certificate: "Product Specialist Certificate",
        tags: ["Sales", "Product Knowledge", "Foundation"],
        status: "ACTIVE",
        createdBy: "admin_user",
        createdDate: "2025-11-01",
        sessions: [
          {
            sessionId: 1,
            sessionName: "Session 1: Introduction to Product Features",
            description: "Overview of core product features and use cases",
            fileName: "session1-slides.pdf",
            moduleId: 1,
            moduleName: "Introduction to Life Insurance",
            moduleDuration: 4,
            sequence: 1
          },
          {
            sessionId: 2,
            sessionName: "Session 2: Product Benefits",
            description: "Understanding customer benefits and competitive advantages",
            moduleId: 2,
            moduleName: "Insurance Products Overview",
            moduleDuration: 4,
            sequence: 2
          },
          {
            sessionId: 3,
            sessionName: "Session 3: Technical Specifications",
            description: "Deep dive into technical details",
            moduleId: 3,
            moduleName: "Customer Service Excellence",
            moduleDuration: 4,
            sequence: 3
          },
          {
            sessionId: 4,
            sessionName: "Session 4: Practical Application",
            description: "Hands-on exercises",
            moduleId: 4,
            moduleName: "Sales Techniques",
            moduleDuration: 4,
            sequence: 4
          }
        ],
        files: [],
        usageCount: 3
      },
      {
        id: 2,
        name: "Advanced Sales Techniques",
        description: "Advanced strategies for experienced sales professionals",
        type: "Skill",
        learnerType: "Advanced",
        license: "Sales Mastery License",
        duration: 12,
        code: "SKILL-001",
        certificate: "Sales Master Certificate",
        tags: ["Sales", "Advanced", "Techniques"],
        status: "ACTIVE",
        createdBy: "admin_user",
        createdDate: "2025-10-15",
        sessions: [
          {
            sessionId: 5,
            sessionName: "Session 1: Consultative Selling",
            description: "Building relationships through consultation",
            moduleId: 5,
            moduleName: "Communication Skills",
            moduleDuration: 4,
            sequence: 1
          },
          {
            sessionId: 6,
            sessionName: "Session 2: Objection Handling",
            description: "Turning objections into opportunities",
            moduleId: 6,
            moduleName: "Presentation Skills",
            moduleDuration: 4,
            sequence: 2
          },
          {
            sessionId: 7,
            sessionName: "Session 3: Closing Strategies",
            description: "Effective techniques for closing deals",
            moduleId: 7,
            moduleName: "Time Management",
            moduleDuration: 4,
            sequence: 3
          }
        ],
        files: [],
        usageCount: 1
      }
    ];
  }

  // Course CRUD
  getCourse(id: number): Course | undefined {
    return this.courses.find(c => c.id === id);
  }

  getCourses(filters: { channel?: string; region?: string; status?: string; search?: string } = {}): Course[] {
    let filtered = [...this.courses];

    if (filters.channel) {
      filtered = filtered.filter(c => c.channel === filters.channel);
    }
    if (filters.region) {
      filtered = filtered.filter(c => c.region === filters.region);
    }
    if (filters.status) {
      filtered = filtered.filter(c => c.status === filters.status);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  createCourse(courseData: Partial<Course>): Course {
    const newCourse: Course = {
      id: Date.now(),
      code: courseData.code || `COURSE-${Date.now()}`,
      name: courseData.name || '',
      program: courseData.program || '',
      trainer: courseData.trainer || '',
      channel: courseData.channel || '',
      region: courseData.region || '',
      status: courseData.status || 'Creating',
      startDate: courseData.startDate || '',
      endDate: courseData.endDate || '',
      venue: courseData.venue || 'NA',
      section: courseData.section || 1,
      createdBy: typeof window !== 'undefined' ? (sessionStorage.getItem('currentUser') || 'LMS Admin Cloudair') : 'LMS Admin Cloudair',
      participantIds: courseData.participantIds || [],
      // Extended fields
      courseType: courseData.courseType,
      licenseType: courseData.licenseType,
      partner: courseData.partner,
      branch: courseData.branch,
      primaryTrainer: courseData.primaryTrainer,
      coTrainer: courseData.coTrainer,
      venueAddress: courseData.venueAddress,
      area: courseData.area,
      province: courseData.province,
      startTimePeriod: courseData.startTimePeriod,
      endTimePeriod: courseData.endTimePeriod,
      description: courseData.description,
      aolStartTime: courseData.aolStartTime,
      aolEndTime: courseData.aolEndTime,
      aolExamId: courseData.aolExamId,
      mofCourseName: courseData.mofCourseName,
      examType: courseData.examType,
      mofExamTime: courseData.mofExamTime,
      isProctorTrainer: courseData.isProctorTrainer,
      proctorTrainer: courseData.proctorTrainer,
      proctorName: courseData.proctorName,
      proctorPhone: courseData.proctorPhone,
      mofAddress: courseData.mofAddress,
      mofProvince: courseData.mofProvince,
      ward: courseData.ward,  // District field removed
      examCategory: courseData.examCategory,
      supporter: courseData.supporter,
    };
    this.courses.push(newCourse);
    this.save('courses');
    return newCourse;
  }

  updateCourse(id: number, updates: Partial<Course>): Course | null {
    const index = this.courses.findIndex(c => c.id === id);
    if (index !== -1) {
      this.courses[index] = { ...this.courses[index], ...updates };
      this.save('courses');
      return this.courses[index];
    }
    return null;
  }

  deleteCourse(id: number): boolean {
    const index = this.courses.findIndex(c => c.id === id);
    if (index !== -1) {
      this.courses.splice(index, 1);
      this.save('courses');
      return true;
    }
    return false;
  }

  // Participant CRUD
  getParticipant(id: number): Participant | undefined {
    return this.participants.find(p => p.id === id);
  }

  getParticipants(filters: { region?: string; channel?: string; search?: string } = {}): Participant[] {
    let filtered = [...this.participants];

    if (filters.region) {
      filtered = filtered.filter(p => p.region === filters.region);
    }
    if (filters.channel) {
      filtered = filtered.filter(p => p.channel === filters.channel);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.agentCode.toLowerCase().includes(search) ||
        p.email.toLowerCase().includes(search) ||
        p.phone.includes(search)
      );
    }

    return filtered;
  }

  createParticipant(participantData: Partial<Participant>): Participant {
    const newParticipant: Participant = {
      id: Date.now(),
      name: participantData.name || '',
      agentCode: participantData.agentCode || '',
      email: participantData.email || '',
      phone: participantData.phone || '',
      region: participantData.region || '',
      channel: participantData.channel || '',
      status: participantData.status || 'Active'
    };
    this.participants.push(newParticipant);
    this.save('participants');
    return newParticipant;
  }

  updateParticipant(id: number, updates: Partial<Participant>): Participant | null {
    const index = this.participants.findIndex(p => p.id === id);
    if (index !== -1) {
      this.participants[index] = { ...this.participants[index], ...updates };
      this.save('participants');
      return this.participants[index];
    }
    return null;
  }

  deleteParticipant(id: number): boolean {
    const index = this.participants.findIndex(p => p.id === id);
    if (index !== -1) {
      this.participants.splice(index, 1);
      this.save('participants');
      return true;
    }
    return false;
  }

  // Course-Participant relationships
  addParticipantToCourse(courseId: number, participantId: number): boolean {
    const course = this.getCourse(courseId);
    if (course && !course.participantIds.includes(participantId)) {
      course.participantIds.push(participantId);
      this.save('courses');
      return true;
    }
    return false;
  }

  removeParticipantFromCourse(courseId: number, participantId: number): boolean {
    const course = this.getCourse(courseId);
    if (course) {
      course.participantIds = course.participantIds.filter(id => id !== participantId);
      this.save('courses');
      return true;
    }
    return false;
  }

  getCourseParticipants(courseId: number): Participant[] {
    const course = this.getCourse(courseId);
    if (course && course.participantIds) {
      return course.participantIds
        .map(id => this.getParticipant(id))
        .filter((p): p is Participant => p !== undefined);
    }
    return [];
  }

  // Trainer CRUD
  getTrainer(id: number): Trainer | undefined {
    return this.trainers.find(t => t.id === id);
  }

  getTrainers(filters: { region?: string; channel?: string; search?: string; type?: string } = {}): Trainer[] {
    let filtered = [...this.trainers];

    if (filters.region) {
      filtered = filtered.filter(t => t.region === filters.region);
    }
    if (filters.type) {
      filtered = filtered.filter(t => t.trainerType === filters.type);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        t.fullName.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search) ||
        t.trainerType.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  createTrainer(trainerData: Partial<Trainer>): Trainer {
    const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
    const newTrainer: Trainer = {
      id: Date.now(),
      fullName: trainerData.fullName || '',
      trainerTitle: trainerData.trainerTitle || '',
      gender: trainerData.gender || '',
      idNumber: trainerData.idNumber || '',
      issueDate: trainerData.issueDate || '',
      issuePlace: trainerData.issuePlace || '',
      email: trainerData.email || '',
      phone: trainerData.phone || '',
      trainerRate: trainerData.trainerRate || 0,
      highestDegree: trainerData.highestDegree || '',
      degree: trainerData.degree || '',
      trainerType: trainerData.trainerType || '',
      location: trainerData.location || '',
      region: trainerData.region || '',
      status: trainerData.status || 'Active',
      createdBy: currentUser,
      createdDate: new Date().toISOString().split('T')[0],
      address: trainerData.address || [],
      experiences: trainerData.experiences || [],
      education: trainerData.education || [],
      rewards: trainerData.rewards || [],
      certifications: trainerData.certifications || [],
      activeRatio: trainerData.activeRatio,
      trainingHistory: trainerData.trainingHistory || []
    };
    this.trainers.push(newTrainer);
    this.save('trainers');
    return newTrainer;
  }

  updateTrainer(id: number, updates: Partial<Trainer>): Trainer | null {
    const index = this.trainers.findIndex(t => t.id === id);
    if (index !== -1) {
      const currentUser = typeof window !== 'undefined' ? (sessionStorage.getItem('userName') || 'System') : 'System';
      this.trainers[index] = { 
        ...this.trainers[index], 
        ...updates,
        updatedBy: currentUser,
        updatedDate: new Date().toISOString().split('T')[0]
      };
      this.save('trainers');
      return this.trainers[index];
    }
    return null;
  }

  deleteTrainer(id: number): boolean {
    const index = this.trainers.findIndex(t => t.id === id);
    if (index !== -1) {
      this.trainers.splice(index, 1);
      this.save('trainers');
      return true;
    }
    return false;
  }

  // User CRUD
  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  getUsers(filters: { search?: string } = {}): User[] {
    let filtered = [...this.users];

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
      );
    }

    return filtered;
  }

  createUser(userData: Partial<User>): User {
    const newUser: User = {
      id: Date.now(),
      username: userData.username || '',
      email: userData.email || '',
      roles: userData.roles || [],
      team: userData.team || '',
      createdDate: new Date().toISOString().split('T')[0]
    };
    this.users.push(newUser);
    this.save('users');
    return newUser;
  }

  updateUser(id: number, updates: Partial<User>): User | null {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users[index] = { ...this.users[index], ...updates };
      this.save('users');
      return this.users[index];
    }
    return null;
  }

  deleteUser(id: number): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      this.save('users');
      return true;
    }
    return false;
  }

  reset() {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('lms_modules');
    localStorage.removeItem('lms_courses');
    localStorage.removeItem('lms_participants');
    localStorage.removeItem('lms_trainers');
    localStorage.removeItem('lms_users');
    this.init();
  }
}

// Singleton instance
export const LMSState = new LMSStateManager();

// Initialize on client side
if (typeof window !== 'undefined') {
  LMSState.init();
}

