import React, { useState } from "react";
import { Student, Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar"; // From shadcn
import { 
  Users, 
  DollarSign, 
  Target, 
  ArrowUpRight, 
  Plus, 
  CalendarClock,
  Briefcase,
  StickyNote,
  MoreHorizontal,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { format, isSameDay, isAfter, startOfDay, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { AddNoteDialog } from "@/components/notes/AddNoteDialog";

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
  onAddTask,
  onOpenStudent,
  onOpenLead
}: OverviewProps) => {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // --- KPI CALCULATIONS ---
  const activeStudents = students.filter(s => s.status === 'active');
  const totalRevenuePending = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  
  // --- CALLS LOGIC ---
  const today = startOfDay(new Date());

  const studentCalls = students.flatMap(s => s.calls.map(c => ({ ...c, type: 'student', details: s, name: `${s.firstName} ${s.lastName}` })));
  const leadCalls = leads
    .filter(l => l.nextCallDate && l.status !== 'won' && l.status !== 'lost')
    .map(l => ({ id: l.id, date: l.nextCallDate!, completed: false, type: 'lead', details: l, name: l.name }));

  const allCalls = [...studentCalls, ...leadCalls]
    // @ts-ignore
    .filter(c => !c.completed && (isAfter(new Date(c.date), new Date(new Date().getTime() - 2 * 60 * 60 * 1000)) || isSameDay(new Date(c.date), today)))
    // @ts-ignore
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const callsToday = allCalls.filter(c => isSameDay(new Date(c.date), today));
  const upcomingCalls = allCalls.slice(0, 5);

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* --- LEFT COLUMN (MAIN) --- */}
        <div className="flex-1 space-y-6 min-w-0">
            
            {/* KPI ROW (Compact) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {/* Card 1: Active Students */}
                <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                                <Users size={14} />
                            </div>
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full flex items-center">
                                <ArrowUpRight size={8} className="mr-0.5" /> 1
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{activeStudents.length}</h2>
                        <p className="text-xs text-muted-foreground font-medium">Alumnos Activos</p>
                    </CardContent>
                </Card>

                 {/* Card 2: Revenue */}
                 <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600">
                                <DollarSign size={14} />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">${(totalRevenuePending / 1000).toFixed(1)}k</h2>
                        <p className="text-xs text-muted-foreground font-medium">Por Cobrar</p>
                        <Progress value={65} className="h-1 mt-2 bg-emerald-100" />
                    </CardContent>
                </Card>

                 {/* Card 3: Leads */}
                 <Card className="bg-gradient-to-br from-white to-orange-50/50 border-orange-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-orange-100 rounded-md text-orange-600">
                                <Target size={14} />
                            </div>
                             {hotLeads.length > 0 && (
                                <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-full">
                                    {hotLeads.length} Hot
                                </span>
                             )}
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{leads.length}</h2>
                        <p className="text-xs text-muted-foreground font-medium">Total Pipeline</p>
                    </CardContent>
                </Card>

                {/* Card 4: New Leads */}
                <Card className="bg-gradient-to-br from-white to-indigo-50/50 border-indigo-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600">
                                <Briefcase size={14} />
                            </div>
                            <span className="text-[10px] text-muted-foreground">Esta semana</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{newLeadsCount}</h2>
                        <p className="text-xs text-muted-foreground font-medium">Nuevos Leads</p>
                    </CardContent>
                </Card>
            </div>

            {/* UPCOMING CALLS LIST */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="px-6 py-4 border-b flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CalendarClock size={18} className="text-primary" /> Agenda Próxima
                    </CardTitle>
                    <Badge variant="outline" className="font-normal">
                        {callsToday.length} hoy
                    </Badge>
                </CardHeader>
                <CardContent className="p-0">
                    {upcomingCalls.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <p className="text-sm">No tienes llamadas próximas.</p>
                            <Button variant="link" size="sm" onClick={() => {}} className="mt-1">
                                Ver Calendario Completo
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

            {/* RECENT ACTIVITY / LEADS (Optional, simpler view) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card>
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Leads Recientes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3">
                        {leads.slice(0, 3).map(lead => (
                            <div key={lead.id} className="flex items-center justify-between" onClick={() => onOpenLead(lead)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${lead.interestLevel === 'high' ? 'bg-red-500' : 'bg-blue-400'}`} />
                                    <div>
                                        <p className="text-sm font-medium hover:underline cursor-pointer">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground">{format(new Date(lead.createdAt), "d MMM", { locale: es })}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                         <Button variant="ghost" size="sm" className="w-full text-xs mt-2" onClick={onAddLead}>Ver todos</Button>
                    </CardContent>
                 </Card>
                 
                 <Card className="bg-slate-900 text-slate-50 border-none">
                     <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Note Bank</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                         <p className="text-sm text-slate-300 mb-4">
                             Captura ideas rápidamente para no perder el contexto.
                         </p>
                         <Button 
                             size="sm" 
                             className="w-full bg-slate-700 hover:bg-slate-600 text-white border-none"
                             onClick={() => setIsAddNoteOpen(true)}
                        >
                             <Plus size={16} className="mr-2" /> Agregar Nota
                         </Button>
                    </CardContent>
                 </Card>
            </div>

        </div>

        {/* --- RIGHT COLUMN (WIDGETS) --- */}
        <div className="lg:w-80 space-y-6 flex flex-col shrink-0">
            
            {/* iOS Style Calendar Widget */}
            <Card className="border-none shadow-md overflow-hidden bg-white relative">
                 {/* Red Header Bar (aesthetic) */}
                <div className="h-1.5 w-full bg-red-500 absolute top-0 left-0" />
                <CardContent className="p-0">
                    <div className="p-4 pb-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-none">
                            {format(today, "MMMM", { locale: es }).charAt(0).toUpperCase() + format(today, "MMMM", { locale: es }).slice(1)}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium">
                            {format(today, "EEEE, d", { locale: es })}
                        </p>
                    </div>
                    <div className="flex justify-center pb-2 scale-90 origin-top">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0 pointer-events-none" // Widget display mostly
                            classNames={{
                                head_cell: "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem]",
                                cell: "h-8 w-8 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
                                day_selected: "bg-red-500 text-white hover:bg-red-500 hover:text-white focus:bg-red-500 focus:text-white rounded-full",
                                day_today: "bg-slate-100 text-slate-900 font-bold rounded-full",
                            }}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Widget */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1">Acciones Rápidas</h4>
                
                <div className="grid grid-cols-2 gap-3">
                     <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50 border-dashed"
                        onClick={onAddStudent}
                    >
                         <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                             <UserPlus size={18} />
                         </div>
                         <span className="text-xs font-medium">Alumno</span>
                     </Button>

                     <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 border-dashed"
                        onClick={onAddLead}
                    >
                         <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                             <Target size={18} />
                         </div>
                         <span className="text-xs font-medium">Lead</span>
                     </Button>

                     <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:border-yellow-300 hover:bg-yellow-50 border-dashed"
                        onClick={() => setIsAddNoteOpen(true)}
                    >
                         <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                             <StickyNote size={18} />
                         </div>
                         <span className="text-xs font-medium">Nota</span>
                     </Button>

                     <Button 
                        variant="outline" 
                        className="h-20 flex flex-col items-center justify-center gap-2 hover:border-indigo-300 hover:bg-indigo-50 border-dashed"
                        onClick={onAddTask}
                    >
                         <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                             <Plus size={18} />
                         </div>
                         <span className="text-xs font-medium">Tarea</span>
                     </Button>
                </div>
            </div>

            {/* Upcoming Birthdays or simple Info Widget */}
             <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-600 border-none text-white shadow-md">
                 <CardContent className="p-4 flex items-center justify-between">
                     <div>
                         <p className="text-xs font-medium text-white/80">Objetivo Mensual</p>
                         <h3 className="text-xl font-bold mt-0.5">$10.0k</h3>
                     </div>
                     <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                         <Target size={20} className="text-white" />
                     </div>
                 </CardContent>
             </Card>

        </div>

      </div>

      <AddNoteDialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen} />
    </div>
  );
};