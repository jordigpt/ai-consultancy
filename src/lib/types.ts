export type AILevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export type BusinessModel = 
  | "Agencia de Automatización (AAA)" 
  | "SaaS Wrapper" 
  | "Creación de Contenido AI" 
  | "Consultoría Estratégica" 
  | "Desarrollo de Chatbots"
  | "Otro";

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
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  occupation: string;
  context: string;
  aiLevel: AILevel;
  businessModel: BusinessModel;
  startDate: Date;
  
  // Finanzas
  paidInFull: boolean;
  amountPaid?: number; // Cuánto pagó
  amountOwed?: number; // Cuánto debe
  
  tasks: Task[];
  calls: Call[]; // Historial y futuras llamadas
}