// API service for CRUD operations with JSON file persistence
import type { Course, Participant, Trainer, User, Program, ChecklistTemplate, CourseChecklistInstance } from './state'

const API_BASE = '/api'

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: response.statusText }))
      const errorMessage = errorData.error || response.statusText || 'Unknown error'
      throw new Error(errorMessage)
    }

    return response.json()
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Network error: Failed to fetch data')
  }
}

// Course API
export const courseAPI = {
  getAll: async (filters?: { channel?: string; region?: string; status?: string; search?: string }): Promise<Course[]> => {
    const queryParams = new URLSearchParams()
    if (filters?.channel) queryParams.append('channel', filters.channel)
    if (filters?.region) queryParams.append('region', filters.region)
    if (filters?.status) queryParams.append('status', filters.status)
    if (filters?.search) queryParams.append('search', filters.search)
    
    const query = queryParams.toString()
    return fetchAPI<Course[]>(`/courses${query ? `?${query}` : ''}`)
  },

  getById: async (id: number): Promise<Course> => {
    return fetchAPI<Course>(`/courses/${id}`)
  },

  create: async (course: Partial<Course>): Promise<Course> => {
    return fetchAPI<Course>('/courses', {
      method: 'POST',
      body: JSON.stringify(course),
    })
  },

  update: async (id: number, updates: Partial<Course>, options?: { editReason?: string; userRole?: string; userName?: string; requiresApproval?: boolean }): Promise<Course> => {
    return fetchAPI<Course>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        updates,
        editReason: options?.editReason || '',
        userRole: options?.userRole || 'trainer',
        userName: options?.userName || 'System',
        requiresApproval: options?.requiresApproval || false,
      }),
    })
  },

  approveEdit: async (id: number, action: 'approve' | 'reject', reason?: string, options?: { userRole?: string; userName?: string }): Promise<Course> => {
    return fetchAPI<Course>(`/courses/${id}/approve-edit`, {
      method: 'PATCH',
      body: JSON.stringify({
        action,
        reason,
        userRole: options?.userRole || 'head_channel',
        userName: options?.userName || 'System',
      }),
    })
  },

  delete: async (id: number): Promise<void> => {
    await fetchAPI<void>(`/courses/${id}`, {
      method: 'DELETE',
    })
  },

  addParticipant: async (courseId: number, participantId: number): Promise<Course> => {
    return fetchAPI<Course>(`/courses/${courseId}/participants/${participantId}`, {
      method: 'POST',
    })
  },

  removeParticipant: async (courseId: number, participantId: number): Promise<Course> => {
    return fetchAPI<Course>(`/courses/${courseId}/participants/${participantId}`, {
      method: 'DELETE',
    })
  },
}

// Participant API
export const participantAPI = {
  getAll: async (filters?: { region?: string; channel?: string; search?: string }): Promise<Participant[]> => {
    const queryParams = new URLSearchParams()
    if (filters?.region) queryParams.append('region', filters.region)
    if (filters?.channel) queryParams.append('channel', filters.channel)
    if (filters?.search) queryParams.append('search', filters.search)
    
    const query = queryParams.toString()
    return fetchAPI<Participant[]>(`/participants${query ? `?${query}` : ''}`)
  },

  getById: async (id: number): Promise<Participant> => {
    return fetchAPI<Participant>(`/participants/${id}`)
  },

  create: async (participant: Partial<Participant>): Promise<Participant> => {
    return fetchAPI<Participant>('/participants', {
      method: 'POST',
      body: JSON.stringify(participant),
    })
  },

  update: async (id: number, updates: Partial<Participant>): Promise<Participant> => {
    return fetchAPI<Participant>(`/participants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: number): Promise<void> => {
    await fetchAPI<void>(`/participants/${id}`, {
      method: 'DELETE',
    })
  },
}

// Trainer API
export const trainerAPI = {
  getAll: async (filters?: { region?: string; channel?: string; search?: string; type?: string }): Promise<Trainer[]> => {
    const queryParams = new URLSearchParams()
    if (filters?.region) queryParams.append('region', filters.region)
    if (filters?.channel) queryParams.append('channel', filters.channel)
    if (filters?.search) queryParams.append('search', filters.search)
    if (filters?.type) queryParams.append('type', filters.type)
    
    const query = queryParams.toString()
    return fetchAPI<Trainer[]>(`/trainers${query ? `?${query}` : ''}`)
  },

  getById: async (id: number): Promise<Trainer> => {
    return fetchAPI<Trainer>(`/trainers/${id}`)
  },

  create: async (trainer: Partial<Trainer>): Promise<Trainer> => {
    return fetchAPI<Trainer>('/trainers', {
      method: 'POST',
      body: JSON.stringify(trainer),
    })
  },

  update: async (id: number, updates: Partial<Trainer>): Promise<Trainer> => {
    return fetchAPI<Trainer>(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: number): Promise<void> => {
    await fetchAPI<void>(`/trainers/${id}`, {
      method: 'DELETE',
    })
  },
}

// User API
export const userAPI = {
  getAll: async (filters?: { search?: string }): Promise<User[]> => {
    const queryParams = new URLSearchParams()
    if (filters?.search) queryParams.append('search', filters.search)
    
    const query = queryParams.toString()
    return fetchAPI<User[]>(`/users${query ? `?${query}` : ''}`)
  },

  getById: async (id: number): Promise<User> => {
    return fetchAPI<User>(`/users/${id}`)
  },

  create: async (user: Partial<User>): Promise<User> => {
    return fetchAPI<User>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    })
  },

  update: async (id: number, updates: Partial<User>): Promise<User> => {
    return fetchAPI<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  delete: async (id: number): Promise<void> => {
    await fetchAPI<void>(`/users/${id}`, {
      method: 'DELETE',
    })
  },
}

// Program API
export const programAPI = {
  getAll: async (): Promise<Program[]> => {
    return fetchAPI<Program[]>('/programs')
  },

  getById: async (id: number): Promise<Program> => {
    return fetchAPI<Program>(`/programs/${id}`)
  },

  create: async (data: Partial<Program>): Promise<Program> => {
    return fetchAPI<Program>('/programs', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  update: async (id: number, data: Partial<Program>): Promise<Program> => {
    return fetchAPI<Program>(`/programs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete: async (id: number): Promise<void> => {
    return fetchAPI<void>(`/programs/${id}`, {
      method: 'DELETE'
    })
  }
}

// Template API
export const templateAPI = {
  getAll: async (courseType?: string): Promise<ChecklistTemplate[]> => {
    const queryParams = new URLSearchParams()
    if (courseType) queryParams.append('courseType', courseType)
    const query = queryParams.toString()
    return fetchAPI<ChecklistTemplate[]>(`/templates${query ? `?${query}` : ''}`)
  },

  getById: async (id: string): Promise<ChecklistTemplate> => {
    return fetchAPI<ChecklistTemplate>(`/templates?id=${id}`)
  },

  create: async (template: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    return fetchAPI<ChecklistTemplate>('/templates', {
      method: 'POST',
      body: JSON.stringify(template)
    })
  },

  update: async (id: string, updates: Partial<ChecklistTemplate>): Promise<ChecklistTemplate> => {
    return fetchAPI<ChecklistTemplate>('/templates', {
      method: 'PUT',
      body: JSON.stringify({ id, ...updates })
    })
  },

  delete: async (id: string): Promise<void> => {
    return fetchAPI<void>(`/templates?id=${id}`, {
      method: 'DELETE'
    })
  }
}

// Course Checklist API
export const courseChecklistAPI = {
  getByCourseId: async (courseId: number): Promise<CourseChecklistInstance> => {
    return fetchAPI<CourseChecklistInstance>(`/courses/${courseId}/checklist`)
  },

  updateStep: async (
    courseId: number,
    stepId: number,
    updates: {
      status: 'not_started' | 'pending' | 'done' | 'overdue' | 'not_applicable'
      notes?: string
      completedBy?: string
      manualMarkDoneReason?: string
      autoDetectedAt?: string
      autoDetectionReason?: string
      lastEvaluatedAt?: string
    }
  ): Promise<CourseChecklistInstance> => {
    return fetchAPI<CourseChecklistInstance>(`/courses/${courseId}/checklist`, {
      method: 'PUT',
      body: JSON.stringify({ stepId, ...updates })
    })
  },

  evaluate: async (courseId: number): Promise<Record<number, any>> => {
    return fetchAPI<Record<number, any>>(`/courses/${courseId}/checklist/evaluate`, {
      method: 'POST'
    })
  },

  evaluateStep: async (courseId: number, stepId: number): Promise<any> => {
    return fetchAPI<any>(`/courses/${courseId}/checklist/evaluate?stepId=${stepId}`, {
      method: 'POST'
    })
  },

  addCustomAction: async (
    courseId: number,
    action: {
      name: string
      description?: string
      pic: string
      reminderTiming?: {
        type: 'none' | 'daily' | 'date_based' | 'course_date_relative'
        start?: string
        end?: string
      }
      reminderRecipients?: Array<{
        type: 'email' | 'channel' | 'region'
        value: string
        label?: string
      }>
    }
  ): Promise<CourseChecklistInstance> => {
    return fetchAPI<CourseChecklistInstance>(`/courses/${courseId}/checklist`, {
      method: 'POST',
      body: JSON.stringify(action)
    })
  },

  deleteCustomAction: async (courseId: number, stepId: number): Promise<CourseChecklistInstance> => {
    return fetchAPI<CourseChecklistInstance>(`/courses/${courseId}/checklist?stepId=${stepId}`, {
      method: 'DELETE'
    })
  }
}

