import { Student, Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ChevronRight } from "lucide-react";
import { format, isSameDay, isAfter, startOfDay } from "date-fns";
import { es } from "date-fns/locale";

interface UpcomingCallsProps {
  students: Student[];
  leads: Lead[];
  onOpenStudent: (s: Student) => void;
  onOpenLead: (l: Lead) => void;
}

export const UpcomingCalls = ({ students, leads, onOpenStudent, onOpenLead }: UpcomingCallsProps) => {
  const today = startOfDay(new Date());
  const now = new Date();

  const studentCalls = students.flatMap(s => s.calls.map(c => ({ ...c, type: 'student', details: s, name: `${s.firstName} ${s.lastName}` })));
  const leadCalls = leads
    .filter(l => l.nextCallDate && l.status !== 'won' && l.status !== 'lost')
    .map(l => ({ id: l.id, date: l.nextCallDate!, completed: false, type: 'lead', details: l, name: l.name }));

  const allCalls = [...studentCalls, ...leadCalls];
  
  // Sort ALL calls by date
  // @ts-ignore
  allCalls.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Upcoming: STRICTLY future calls (isAfter checks both date and time)
  const upcomingCalls = allCalls.filter(c => isAfter(new Date(c.date), now)).slice(0, 5);

  return (
    <Card className="border-none shadow-sm bg-white">
        <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarClock size={18} className="text-primary" /> Agenda Próxima
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
            {upcomingCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No hay llamadas pendientes hoy/futuro.</p>
                    <Button variant="link" size="sm" className="mt-1">
                        Ver Calendario
                    </Button>
                </div>
            ) : (
                <div className="divide-y">
                    {upcomingCalls.map((call, idx) => (
                        <div 
                            key={`${call.type}-${call.id}-${idx}`} 
                            className="flex items-center p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                            onClick={() => call.type === 'student' ? onOpenStudent(call.details as Student) : onOpenLead(call.details as Lead)}
                        >
                            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-slate-100 border text-slate-600 mr-4 group-hover:bg-white group-hover:border-primary/30 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                                    {format(new Date(call.date), "MMM", { locale: es })}
                                </span>
                                <span className="text-lg font-bold leading-none mt-0.5">
                                    {format(new Date(call.date), "d")}
                                </span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-sm truncate text-slate-900 group-hover:text-primary transition-colors">
                                        {call.name}
                                    </h4>
                                    {call.type === 'lead' && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 h-4 bg-orange-100 text-orange-700 hover:bg-orange-100">
                                            Lead
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <CalendarClock size={12} /> {format(new Date(call.date), "HH:mm")} hs
                                    </span>
                                    {isSameDay(new Date(call.date), today) && (
                                        <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 rounded-full">
                                            Hoy
                                        </span>
                                    )}
                                </div>
                            </div>
                            
                            <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight size={18} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
};