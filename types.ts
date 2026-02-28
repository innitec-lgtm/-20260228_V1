
export enum Urgency {
  HIGH = '高',
  MEDIUM = '中',
  LOW = '低'
}

export enum TicketStatus {
  PENDING = '等待處理',
  IN_PROGRESS = '處理中',
  COMPLETED = '已完修'
}

export interface Engineer {
  id: string;
  name: string;
  isDefault?: boolean;
}

export interface Contact {
  id: string;
  name: string;
  department: string;
  extension: string;
}

export interface Ticket {
  id: string;
  name: string;
  department: string;
  phone: string;
  requirement: string;
  urgency: Urgency;
  requestTime: number; // timestamp
  status: TicketStatus;
  
  // Processing fields
  processNote?: string;
  completionTime?: number; // timestamp
  assignedEngineer?: string;
  signature?: string; // base64 signature image
}

export type AppView = 'request' | 'pending' | 'reports' | 'settings' | 'tracking' | 'contacts';
