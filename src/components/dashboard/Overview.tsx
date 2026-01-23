import React from "react";
import { Student, Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  Plus, 
  CalendarClock,
  Briefcase,
  MoreHorizontal
} from "lucide-react";
import { format, isSameDay, isAfter, startOfDay, addDays, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { MentorTasksView } from "@/components/tasks/MentorTasksView";

interface OverviewProps {
  students: Student[];
  leads: Lead[];
  onAddStudent: () => void;
  onAddLead: () => void;
  onAddTask: () => void;
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
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
      {/* --- TOP ROW: KPI CARDS --- */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Active Students */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-blue-600 uppercase tracking-wider">Alumnos Activos</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{activeStudents.length}</h2>
              </div>
              <div className="p-1.5 sm:p-2 bg-blue-100 rounded-lg text-blue-600">
                <Users size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
               <span className="text-emerald-600 font-medium flex items-center">
                 <ArrowUpRight size={10} className="mr-1" /> +1 este mes
               </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Financials */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-emerald-600 uppercase tracking-wider">Cobros Pendientes</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">${totalRevenuePending.toLocaleString()}</h2>
              </div>
              <div className="p-1.5 sm:p-2 bg-emerald-100 rounded-lg text-emerald-600">
                <DollarSign size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 w-full">
               <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                 <span>Progreso de cobro</span>
                 <span>65%</span>
               </div>
               <Progress value={65} className="h-1.5 bg-emerald-200" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Pipeline */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-100 shadow-sm col-span-2 sm:col-span-1">
          <CardContent className="p-3 sm:p-4 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] sm:text-xs font-medium text-orange-600 uppercase tracking-wider">Pipeline (Leads)</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1">{leads.length}</h2>
              </div>
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg text-orange-600">
                <Target size={16} className="sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="mt-2 sm:mt-4 flex gap-2 flex-wrap">
                <div className="px-2 py-0.5 bg-white/60 rounded text-[10px] sm:text-xs font-medium text-orange-800 border border-orange-100">
                    🔥 {hotLeads.length} Alta
                </div>
                <div className="px-2 py-0.5 bg-white/60 rounded text-[10px] sm:text-xs font-medium text-blue-800 border border-blue-100">
                    🆕 {newLeadsCount} Nuevos
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Action / Calls */}
        <Card 
            className="bg-white border-dashed border-2 border-gray-200 shadow-none hover:border-primary/50 transition-colors cursor-pointer group active:bg-gray-50 col-span-2 sm:col-span-1" 
            onClick={onAddStudent}
        >
          <CardContent className="p-3 sm:p-4 flex flex-row sm:flex-col items-center justify-center h-full text-center space-x-3 sm:space-x-0 sm:space-y-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary/5 group-hover:bg-primary/10 flex items-center justify-center text-primary transition-colors shrink-0">
                <Plus size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-left sm:text-center">
                <p className="font-semibold text-gray-900 text-sm sm:text-base">Registrar Alumno</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Acción Rápida</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* LEFT COLUMN (2/3) */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* 1. UPCOMING SCHEDULE */}
            <Card>
                <CardHeader className="p-3 sm:p-6 sm:pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <CalendarClock size={16} className="text-primary sm:w-[18px] sm:h-[18px]" /> Próximas Llamadas
                    </CardTitle>
                    <Badge variant={callsToday.length > 0 ? "default" : "secondary"} className="text-[10px] sm:text-xs">
                        {callsToday.length} hoy
                    </Badge>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                    {allCalls.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground bg-slate-50 rounded-lg border border-dashed text-sm">
                            Sin llamadas próximas.
                        </div>
                    ) : (
                        <div className="space-y-2 sm:space-y-3">
                            {allCalls.map((call, idx) => (
                                <div 
                                    key={`${call.type}-${call.id}-${idx}`} 
                                    className="flex items-center p-2 sm:p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer active:scale-[0.99]"
                                    onClick={() => call.type === 'student' ? onOpenStudent(call.details as Student) : onOpenLead(call.details as Lead)}
                                >
                                    <div className={`h-8 w-8 sm:h-10 sm:w-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm mr-3 shrink-0 ${
                                        call.type === 'lead' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {call.type === 'lead' ? <Target size={14} className="sm:w-[18px] sm:h-[18px]" /> : <Users size={14} className="sm:w-[18px] sm:h-[18px]" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm truncate">{call.name}</h4>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                            {format(new Date(call.date), "EEEE d, HH:mm", { locale: es })}
                                            {call.type === 'lead' && <span className="text-orange-600 bg-orange-50 px-1 rounded text-[10px] ml-1 font-medium border border-orange-100 shrink-0">Lead</span>}
                                        </p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="shrink-0 h-8 w-8">
                                        <MoreHorizontal size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 2. RECENT LEADS */}
            <Card>
                <CardHeader className="p-3 sm:p-6 sm:pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        <Briefcase size={16} className="text-orange-500 sm:w-[18px] sm:h-[18px]" /> Leads Recientes
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="text-xs h-8 px-2" onClick={onAddLead}>
                        <Plus size={12} className="mr-1" /> Nuevo
                    </Button>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                    <div className="space-y-0 divide-y">
                        {leads.slice(0, 4).map(lead => (
                            <div 
                                key={lead.id} 
                                className="py-2.5 sm:py-3 flex items-center justify-between hover:bg-gray-50 px-2 rounded-md cursor-pointer transition-colors -mx-2 active:bg-gray-100"
                                onClick={() => onOpenLead(lead)}
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                         lead.interestLevel === 'high' ? 'bg-red-500' : 
                                         lead.interestLevel === 'medium' ? 'bg-orange-500' : 'bg-blue-400'
                                    }`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{lead.name}</p>
                                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{lead.email || lead.phone || "Sin contacto"}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <span className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full border ${
                                        lead.interestLevel === 'high' ? 'bg-red-50 text-red-700 border-red-100' : 
                                        lead.interestLevel === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-100' : 'bg-gray-100 text-gray-600'
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
                    {leads.length === 0 && (
                        <div className="text-center py-4 text-xs text-muted-foreground">
                            No hay leads registrados.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN (1/3) - TASKS */}
        <div className="lg:col-span-1">
             <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-2 sm:pb-4">
                     <CardTitle className="text-base sm:text-lg font-semibold flex items-center gap-2">
                        Lista de Tareas
                    </CardTitle>
                </CardHeader>
                <div className="flex-1">
                     <MentorTasksView />
                </div>
            </Card>
        </div>

      </div>
    </div>
  );
};