export type AILevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type BusinessModel = 
  | "Agencia de Automatización (AAA)" 
  | "SaaS Wrapper" 
  | "Creación de Contenido AI" 
  | "Consultoría Estratégica" 
  | "Desarrollo de Chatbots"
  | "VibeCoding de apps"
  | "Otro";

export type StudentStatus = "active" | "graduated";

export type HealthScore = "green" | "yellow" | "red";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt?: Date;
}

export interface Call {
  id: string;
  date: Date;
  notes?: string;
  completed: boolean;
  studentId?: string;
  leadId?: string;
}

export interface StudentNote {
  id: string;
  content: string;
  createdAt: Date;
}

export interface StudentEvent {
  id: string;
  eventType: string;
  description: string;
  createdAt: Date;
  metadata?: any;
}

export interface StudentPayment {
  id: string;
  studentId: string;
  amount: number;
  paymentDate: Date;
  notes?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email?: string; 
  occupation: string;
  context: string;
  aiLevel: AILevel;
  businessModel: BusinessModel;
  startDate: Date;
  status: StudentStatus;
  healthScore: HealthScore;
  
  // Finanzas
  paidInFull: boolean;
  amountPaid?: number; // Legacy / Total Lifetime
  amountOwed?: number; // Legacy / Debt
  nextBillingDate?: Date; // NEW: Controls the billing cycle

  // Archivos
  roadmapUrl?: string; 
  
  tasks: Task[];
  calls: Call[];
  notes: StudentNote[];
  events: StudentEvent[];
  payments?: StudentPayment[]; // NEW: Payment history
}

// LEADS TYPES
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'paused' | 'lost' | 'won';
export type InterestLevel = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  interestLevel: InterestLevel;
  value?: number;
  notes: string;
  nextCallDate?: Date;
  createdAt: Date;
  calls: Call[];
}

// MENTOR TASKS TYPES
export type TaskPriority = 'high' | 'medium' | 'low';

export interface MentorTask {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  completed: boolean;
  createdAt: Date;
  studentId?: string;
  leadId?: string;
  relatedName?: string;
  relatedType?: 'student' | 'lead';
}

// NOTES TYPES
export type NoteCategory = 'Reel' | 'Story' | 'Guía' | 'SOP' | 'Otro';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string; 
  isPinned: boolean;
  createdAt: Date;
}

// SETTINGS & REVENUE TYPES
export interface MonthlyRevenue {
  monthKey: string; // "2024-02"
  agencyRevenue: number;
  gumroadRevenue: number;
}