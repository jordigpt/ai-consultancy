import React from "react";
import { Student } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Flag, 
    Phone, 
    CircleDot,
    TrendingUp,
    BrainCircuit,
    History
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentTimelineProps {
  student: Student;
}

interface TimelineEvent {
    id: string;
    date: Date;
    type: 'start' | 'call' | 'task_created' | 'history_event';
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
}

export const StudentTimeline = ({ student }: StudentTimelineProps) => {
  const events: TimelineEvent[] = [];

  // 1. Start Date
  events.push({
      id: 'start',
      date: student.startDate,
      type: 'start',
      title: 'Inicio del Programa',
      subtitle: student.businessModel,
      icon: <Flag size={14} />,
      color: 'bg-blue-100 text-blue-600 border-blue-200'
  });

  // 2. Calls
  student.calls.forEach(call => {
      events.push({
          id: `call-${call.id}`,
          date: call.date,
          type: 'call',
          title: 'Sesión de Consultoría',
          subtitle: call.completed ? 'Completada' : 'Agendada',
          icon: <Phone size={14} />,
          color: call.completed ? 'bg-green-100 text-green-600 border-green-200' : 'bg-orange-100 text-orange-600 border-orange-200'
      });
  });

  // 3. Tasks
  student.tasks.forEach(task => {
      if (task.createdAt) {
          events.push({
            id: `task-create-${task.id}`,
            date: task.createdAt,
            type: 'task_created',
            title: 'Nueva Tarea Asignada',
            subtitle: task.title,
            icon: <CircleDot size={14} />,
            color: 'bg-slate-100 text-slate-600 border-slate-200'
          });
      }
  });

  // 4. History Events (AI Level Changes, etc.)
  student.events?.forEach(event => {
      let icon = <History size={14} />;
      let color = 'bg-violet-100 text-violet-600 border-violet-200';
      
      if (event.eventType === 'ai_level_change') {
          icon = <TrendingUp size={14} />;
          // If level went up significantly, maybe gold color, etc.
      }

      events.push({
          id: `event-${event.id}`,
          date: event.createdAt,
          type: 'history_event',
          title: event.eventType === 'ai_level_change' ? 'Progreso: Nivel AI' : 'Evento de Historial',
          subtitle: event.description,
          icon: icon,
          color: color
      });
  });

  // Sort events reverse chronological (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
                <BrainCircuit size={16} /> Evolución y Cronología
            </h3>
        </div>
        
        <ScrollArea className="h-[350px] pr-4">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4 pt-2">
                {events.map((event, idx) => (
                    <div key={event.id} className="relative pl-6 group">
                        {/* Dot on line */}
                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${event.color}`}>
                            {event.icon}
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-1 ml-1">
                                {format(event.date, "d MMM, yyyy - HH:mm", { locale: es })}
                            </span>
                            <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-medium text-sm text-slate-900">{event.title}</h4>
                                {event.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{event.subtitle}</p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    </div>
  );
};