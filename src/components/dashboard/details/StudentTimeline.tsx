import React from "react";
import { Student } from "@/lib/types";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
    Flag, 
    Phone, 
    CheckSquare, 
    Square, 
    CalendarClock,
    CircleDot
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StudentTimelineProps {
  student: Student;
}

interface TimelineEvent {
    id: string;
    date: Date;
    type: 'start' | 'call' | 'task_created' | 'task_completed';
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
      // If we have createdAt we use it, otherwise we skip or use a fallback. 
      // Current type definition has optional createdAt.
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
      
      // If completed, ideally we'd have completedAt. We don't have it yet.
      // So we just show creation. If we really wanted completion time we'd need to add that column.
      // For now, let's just show task creation if available, or just list tasks.
      // Actually, let's skip task completion date for now to avoid confusion.
  });

  // Sort events reverse chronological (newest first)
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <CalendarClock size={16} /> Línea de Tiempo
        </h3>
        
        <ScrollArea className="h-[300px] pr-4">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 pb-4">
                {events.map((event, idx) => (
                    <div key={event.id} className="relative pl-6 group">
                        {/* Dot on line */}
                        <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center ${event.color}`}>
                            {event.icon}
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-500 mb-0.5">
                                {format(event.date, "d MMM, yyyy - HH:mm", { locale: es })}
                            </span>
                            <div className="bg-white border rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-medium text-sm text-slate-900">{event.title}</h4>
                                {event.subtitle && (
                                    <p className="text-xs text-muted-foreground mt-1">{event.subtitle}</p>
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