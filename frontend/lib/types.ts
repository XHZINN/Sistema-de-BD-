export interface Client {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  status: 'active' | 'inactive' | 'pending'
  lastVisit: string | null
  nextVisit: string | null
  createdAt: string
  avatar?: string
}

export interface Task {
  id: string
  title: string
  description: string
  status: 'pending' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate: string
  clientId?: string
  createdAt: string
}

export interface Visit {
  id: string
  clientId?: string
  clientName?: string
  title: string
  scheduledDate: string
  startTime?: string
  endTime?: string
  duration?: number
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  observations: string
  participants: string[]
  createdAt: string
}

export interface Report {
  id: string
  clientId: string
  title: string
  content: string
  type: 'visit' | 'analysis' | 'recommendation' | 'follow-up'
  createdAt: string
  sentAt?: string
}

export interface Message {
  id: string
  clientId?: string
  clientName: string
  channel: 'whatsapp' | 'email' | 'phone' | 'other'
  content: string
  direction: 'incoming' | 'outgoing'
  read: boolean
  createdAt: string
}

export interface Observation {
  id: string
  clientId: string
  content: string
  createdAt: string
}
