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

export interface Task {
  id: string;
  title: string;
  completed: boolean;
}

export interface Call {
  id: string;
  date: Date;
  notes?: string;
  completed: boolean;
  studentId?: string; // Optional linkage
  leadId?: string;    // Optional linkage
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
  
  // Finanzas
  paidInFull: boolean;
  amountPaid?: number;
  amountOwed?: number;
  
  // Archivos
  roadmapUrl?: string; 
  
  tasks: Task[];
  calls: Call[];
}

// LEADS TYPES
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'lost' | 'won';
export type InterestLevel = 'low' | 'medium' | 'high';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
  interestLevel: InterestLevel;
  notes: string;
  nextCallDate?: Date; // Keep for sorting/legacy, but calls[] is the source of truth for list
  createdAt: Date;
  calls: Call[]; // Added list of calls
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
  // Optional for UI
  relatedName?: string;
  relatedType?: 'student' | 'lead';
}

// NOTES TYPES
export type NoteCategory = 'Reel' | 'Story' | 'Guía' | 'SOP' | 'Otro';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string; // Flexible string to allow custom categories later
  isPinned: boolean;
  createdAt: Date;
}

// SETTINGS TYPES
export interface UserSettings {
  userId: string;
  monthlyGoal: number;
  gumroadRevenue: number;
  currency: string;
}