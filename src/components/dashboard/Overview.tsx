import React from "react";
import { Student, Lead, Call } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Target, 
  Phone, 
  ArrowUpRight, 
  Plus, 
  CalendarClock,
  Briefcase,
  MoreHorizontal
} from "lucide-react";
import { format, isSameDay, isAfter, startOfDay, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { MentorTasksView } from "@/components/tasks/MentorTasksView";
import { formatDistanceToNow } from "date-fns";

interface OverviewProps {
  students: Student[];
  leads: Lead[];
  onAddStudent: () => void;
  onAddLead: () => void;
  onAddTask: () => void; // We'll trigger the task dialog via the tasks view or a prop
  onOpenStudent: (s: Student) => void;
  onOpenLead: (l: Lead) => void;
}

export const Overview = ({ 
  students, 
  leads, 
  onAddStudent, 
  onAddLead,
  onOpenStudent,
  onOpenLead
}: OverviewProps) => {

  // --- KPI CALCULATIONS ---
  const activeStudents = students.filter(s => s.status === 'active');
  const totalRevenuePending = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  
  // --- UPCOMING CALLS LOGIC ---
  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const studentCalls = students.flatMap(s => s.calls.map(c => ({ ...c, type: 'student', details: s, name: `${s.firstName} ${s.lastName}` })));
  const leadCalls = leads
    .filter(l => l.nextCallDate && l.status !== 'won' && l.status !== 'lost')
    .map(l => ({ id: l.id, date: l.nextCallDate!, completed: false, type: 'lead', details: l, name: l.name }));

  const allCalls = [...studentCalls, ...leadCalls]
    // @ts-ignore
    .filter(c => !c.completed && isAfter(new Date(c.date), new Date(new Date().getTime() - 2 * 60 * 60 * 1000))) // Future or recent calls (2h ago)
    // @ts-ignore
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5); // Take only 5

  const callsToday = allCalls.filter(c => isSameDay(new Date(c.date), today));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* --- TOP ROW: KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Active Students */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Alumnos Activos</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">{activeStudents.length}</h2>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Users size={20} />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
               <span className="text-emerald-600 font-medium flex items-center">
                 <ArrowUpRight size={12} className="mr-1" /> +1 este mes
               </span>
               en total
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Financials */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Cobros Pendientes</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">${totalRevenuePending.toLocaleString()}</h2>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <DollarSign size={20} />
              </div>
            </div>
            <div className="mt-4 w-full">
               <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                 <span>Progreso de cobro</span>
                 <span>65%</span>
               </div>
               <Progress value={65} className="h-1.5 bg-emerald-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pipeline */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 shadow-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Pipeline (Leads)</p>
                <h2 className="text-3xl font-bold text-slate-800 mt-1">{leads.length}</h2>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                <Target size={20} />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
                <div className="px-2 py-1 bg-white/60 rounded text-xs font-medium text-orange-800 border border-orange-100">
                    🔥 {hotLeads.length} Alta
                </div>
                <div className="px-2 py-1 bg-white/60 rounded text-xs font-medium text-blue-800 border border-blue-100">
                    🆕 {newLeadsCount} Nuevos
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Action / Calls */}
        <Card className="bg-white border-dashed border-2 border-gray-200 shadow-none hover:border-primary/50 transition-colors cursor-pointer group" onClick={onAddStudent}>
          <CardContent className="p-4 flex flex-col items-center justify-center h-full text-center space-y-2">
            <div className="h-12 w-12 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary transition-colors">
                <Plus size={24} />
            </div>
            <div>
                <p className="font-semibold text-gray-900">Acción Rápida</p>
                <p className="text-xs text-muted-foreground">Registrar nuevo alumno</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-6">
            
            {/* 1. UPCOMING SCHEDULE */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <CalendarClock size={18} className="text-primary" /> Próximas Llamadas
                    </CardTitle>
                    <Badge variant={callsToday.length > 0 ? "default" : "secondary"}>
                        {callsToday.length} para hoy
                    </Badge>
                </CardHeader>
                <CardContent>
                    {allCalls.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            No tienes llamadas próximas agendadas.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {allCalls.map((call, idx) => (
                                <div 
                                    key={`${call.type}-${call.id}-${idx}`} 
                                    className="flex items-center p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                                    onClick={() => call.type === 'student' ? onOpenStudent(call.details as Student) : onOpenLead(call.details as Lead)}
                                >
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm mr-4 shrink-0 ${
                                        call.type === 'lead' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {call.type === 'lead' ? <Target size={18} /> : <Users size={18} />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{call.name}</h4>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            {format(new Date(call.date), "EEEE d, HH:mm", { locale: es })} hs
                                            {call.type === 'lead' && <span className="text-orange-600 bg-orange-50 px-1 rounded text-[10px] ml-1 font-medium border border-orange-100">Lead</span>}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="shrink-0">
                                        <MoreHorizontal size={16} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. RECENT LEADS */}
            <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Briefcase size={18} className="text-orange-500" /> Leads Recientes
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-8" onClick={onAddLead}>
                        <Plus size={12} className="mr-1" /> Nuevo Lead
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-0 divide-y">
                        {leads.slice(0, 4).map(lead => (
                            <div 
                                key={lead.id} 
                                className="py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md cursor-pointer transition-colors -mx-2"
                                onClick={() => onOpenLead(lead)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                                    <div>
                                        <p className="text-sm font-medium">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground">{lead.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                                        lead.interestLevel === 'high' ? 'bg-red-50 text-red-700 border-red-100' : 
                                        lead.interestLevel === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-100'
                                    }`}>
                                        {lead.interestLevel === 'high' ? 'Alta' : lead.interestLevel === 'medium' ? 'Media' : 'Baja'}
                                    </span>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                        {formatDistanceToNow(new Date(lead.createdAt), { locale: es, addSuffix: true })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN (1/3) - TASKS */}
        <div className="lg:col-span-1">
             <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                     <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        Lista de Tareas
                    </CardTitle>
                </CardHeader>
                <div className="flex-1">
                     {/* We embed the existing mentor tasks view but we style it slightly via CSS or just simpler usage */}
                     <MentorTasksView />
                </div>
            </Card>
        </div>

      </div>
    </div>
  );
};