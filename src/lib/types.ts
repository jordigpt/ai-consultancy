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

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  occupation: string;
  context: string; // Descripción
  aiLevel: AILevel;
  businessModel: BusinessModel;
  startDate: Date;
  nextCall?: Date; // Para la sección de videollamadas
  paidInFull: boolean;
  tasks: Task[];
  avatarUrl?: string;
}