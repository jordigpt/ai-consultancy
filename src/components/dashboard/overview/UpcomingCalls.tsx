import { Student, Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarClock, ChevronRight } from "lucide-react";
import { format, isSameDay, isAfter } from "date-fns";
import { es } from "date-fns/locale";

interface UpcomingCallsProps {
  students: Student[];
  leads: Lead[];
  onOpenStudent: (s: Student) => void;
  onOpenLead: (l: Lead) => void;
}

export const UpcomingCalls = ({ students, leads, onOpenStudent, onOpenLead }: UpcomingCallsProps) => {
  const now = new Date();

  // 1. Unificar llamadas
  const studentCalls = students.flatMap(s => s.calls.map(c => ({ ...c, type: 'student', details: s, name: `${s.firstName} ${s.lastName}` })));
  const leadCalls = leads
    .filter(l => l.nextCallDate && l.status !== 'won' && l.status !== 'lost')
    .map(l => ({ id: l.id, date: l.nextCallDate!, completed: false, type: 'lead', details: l, name: l.name }));

  const allCalls = [...studentCalls, ...leadCalls];
  
  // 2. Ordenar por fecha
  // @ts-ignore
  allCalls.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 3. Filtrar futuras y limitar a 3
  const upcomingCalls = allCalls.filter(c => isAfter(new Date(c.date), now)).slice(0, 3);

  // 4. Agrupar por día
  const groupedCalls = upcomingCalls.reduce((acc, call) => {
    const dateKey = format(new Date(call.date), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(call);
    return acc;
  }, {} as Record<string, typeof upcomingCalls>);

  return (
    <Card className="border-none shadow-sm bg-white h-full">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between min-h-[50px]">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CalendarClock size={16} className="text-primary" /> Agenda Próxima
            </CardTitle>
            {upcomingCalls.length > 0 && (
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2 text-muted-foreground">
                    Ver agenda <ChevronRight size={10} className="ml-1" />
                </Button>
            )}
        </CardHeader>
        <CardContent className="p-0">
            {upcomingCalls.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                    <p className="text-xs">No hay llamadas próximas.</p>
                </div>
            ) : (
                <div className="flex flex-col px-4 py-2 space-y-3">
                    {Object.entries(groupedCalls).map(([dateKey, calls]) => {
                        const dateObj = new Date(calls[0].date);
                        const isToday = isSameDay(dateObj, new Date());
                        
                        return (
                            <div key={dateKey} className="space-y-1">
                                {/* Header del Grupo */}
                                <h4 className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {isToday ? 'Hoy' : format(dateObj, "EEE d 'de' MMM", { locale: es })}
                                </h4>
                                
                                {/* Lista de eventos del día */}
                                <div className="divide-y border rounded-md">
                                    {calls.map((call, idx) => (
                                        <div 
                                            key={`${call.type}-${call.id}-${idx}`} 
                                            className="flex items-center gap-3 p-2 hover:bg-slate-50 transition-colors cursor-pointer text-sm bg-white first:rounded-t-md last:rounded-b-md"
                                            onClick={() => call.type === 'student' ? onOpenStudent(call.details as Student) : onOpenLead(call.details as Lead)}
                                        >
                                            <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {format(new Date(call.date), "HH:mm")}
                                            </span>
                                            
                                            <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                                <span className="font-medium truncate text-slate-700">
                                                    {call.name}
                                                </span>
                                                {call.type === 'lead' && (
                                                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded-sm uppercase font-bold tracking-tighter">
                                                        Lead
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </CardContent>
    </Card>
  );
};