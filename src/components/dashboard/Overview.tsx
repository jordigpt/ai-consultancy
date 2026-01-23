import React, { useState } from "react";
import { Student, Lead, MentorTask, TaskPriority } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar"; 
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  DollarSign, 
  Target, 
  Plus, 
  CalendarClock,
  Briefcase,
  StickyNote,
  ChevronRight,
  UserPlus,
  CheckSquare,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  User,
  Bell,
  Clock,
  ArrowRight
} from "lucide-react";
import { format, isSameDay, isAfter, startOfDay, isSameMonth, differenceInDays, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { AddNoteDialog } from "@/components/notes/AddNoteDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface OverviewProps {
  students: Student[];
  leads: Lead[];
  mentorTasks: MentorTask[];
  monthlyGoal: number;
  onAddStudent: () => void;
  onAddLead: () => void;
  onAddTask: () => void;
  onOpenStudent: (s: Student) => void;
  onOpenLead: (l: Lead) => void;
  onToggleTask: (task: MentorTask) => void;
}

export const Overview = ({ 
  students, 
  leads, 
  mentorTasks,
  monthlyGoal,
  onAddStudent, 
  onAddLead,
  onAddTask,
  onOpenStudent,
  onOpenLead,
  onToggleTask
}: OverviewProps) => {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [expandedTask, setExpandedTask] = useState<MentorTask | null>(null);

  // --- KPI CALCULATIONS ---
  const activeStudents = students.filter(s => s.status === 'active');
  
  // Revenue Stats
  const totalAmountPaid = activeStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const totalAmountOwed = activeStudents.reduce((acc, curr) => acc + (curr.amountOwed || 0), 0);
  const totalPotentialRevenue = totalAmountPaid + totalAmountOwed;
  // Progress Bar: (Paid / Total Potential) * 100
  const collectionProgress = totalPotentialRevenue > 0 ? (totalAmountPaid / totalPotentialRevenue) * 100 : 0;

  // Monthly Goal Logic
  const currentMonthStudents = students.filter(s => isSameMonth(new Date(s.startDate), new Date()));
  const monthlyRevenue = currentMonthStudents.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0);
  const monthlyProgress = Math.min((monthlyRevenue / (monthlyGoal || 1)) * 100, 100);

  // Pipeline Stats
  const hotLeads = leads.filter(l => l.interestLevel === 'high' && l.status !== 'won' && l.status !== 'lost');
  const newLeadsCount = leads.filter(l => l.status === 'new').length;
  
  // Stagnant Leads (+7 days)
  const stagnantLeads = leads.filter(lead => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt));
    return daysSinceCreation >= 7 && lead.status !== 'won' && lead.status !== 'lost';
  });

  // --- CALLS LOGIC (Strict Future Time) ---
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

  // --- TASKS SORTING ---
  const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
  
  const sortedTasks = [...mentorTasks].sort((a, b) => {
      // 1. Sort by Priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      // 2. Sort by Date
      return b.createdAt.getTime() - a.createdAt.getTime();
  }).slice(0, 5);

  const getPriorityIcon = (p: TaskPriority) => {
    switch(p) {
        case 'high': return <AlertTriangle size={14} className="text-red-500" />;
        case 'medium': return <ArrowUpCircle size={14} className="text-orange-500" />;
        case 'low': return <ArrowDownCircle size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* NOTIFICATIONS SECTION */}
      {stagnantLeads.length > 0 && (
         <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-0.5 sm:mt-0">
                    <Bell size={18} />
                </div>
                <div>
                    <h3 className="font-semibold text-orange-900">Seguimiento Requerido</h3>
                    <p className="text-sm text-orange-700">
                        Tienes {stagnantLeads.length} leads sin actualizar hace más de 7 días.
                    </p>
                </div>
            </div>
            <Button variant="outline" size="sm" className="bg-white border-orange-200 text-orange-800 hover:bg-orange-100 whitespace-nowrap" onClick={() => onOpenLead(stagnantLeads[0])}>
                Ver Leads <ArrowRight size={14} className="ml-1" />
            </Button>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* --- LEFT COLUMN (MAIN) --- */}
        <div className="flex-1 space-y-6 min-w-0">
            
            {/* KPI ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                 {/* Card 1: Active Students */}
                <Card className="bg-gradient-to-br from-white to-blue-50/50 border-blue-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-blue-100 rounded-md text-blue-600">
                                <Users size={14} />
                            </div>
                            <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                Total
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{activeStudents.length}</h2>
                        <p className="text-xs text-muted-foreground font-medium">Alumnos Activos</p>
                    </CardContent>
                </Card>

                 {/* Card 2: Revenue (Calculated) */}
                 <Card className="bg-gradient-to-br from-white to-emerald-50/50 border-emerald-100 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-2">
                             <div className="p-1.5 bg-emerald-100 rounded-md text-emerald-600">
                                <DollarSign size={14} />
                            </div>
                             <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                Cobrado
                            </span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">${(totalAmountOwed / 1000).toFixed(1)}k</h2>
                        <p className="text-xs text-muted-foreground font-medium">Pendiente de cobro</p>
                        <div className="mt-2 space-y-1">
                            <Progress value={collectionProgress} className="h-1 bg-emerald-100" />
                            <p className="text-[10px] text-right text-emerald-600 font-medium">
                                {collectionProgress.toFixed(0)}% Cobrado
                            </p>
                        </div>
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
                            <span className="text-[10px] text-muted-foreground">Status New</span>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">{newLeadsCount}</h2>
                        <p className="text-xs text-muted-foreground font-medium">Por Contactar</p>
                    </CardContent>
                </Card>
            </div>

            {/* UPCOMING CALLS LIST */}
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

            {/* TASKS LIST & RECENT ACTIVITY */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Card className="flex flex-col">
                    <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                         <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <CheckSquare size={14} /> Tareas Prioritarias
                         </CardTitle>
                         <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onAddTask}>
                            <Plus size={12} className="mr-1" /> Nueva
                         </Button>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 flex-1">
                        {sortedTasks.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-6 text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50">
                                <p className="text-sm">¡Todo listo!</p>
                                <p className="text-xs mt-1">No tienes tareas pendientes.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sortedTasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                        <Checkbox 
                                            checked={task.completed}
                                            onCheckedChange={() => onToggleTask(task)}
                                            className="mt-1"
                                        />
                                        <div 
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => setExpandedTask(task)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm font-medium leading-tight ${task.priority === 'high' ? 'text-slate-900' : 'text-slate-700'}`}>
                                                    {task.title}
                                                </p>
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {getPriorityIcon(task.priority)}
                                                </div>
                                            </div>
                                            
                                            {task.relatedName && (
                                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                    <User size={10} />
                                                    <span className="truncate">{task.relatedName}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <Button variant="link" size="sm" className="w-full text-xs h-6 mt-2 text-muted-foreground" onClick={onAddTask}>
                                    Ver todas las tareas
                                </Button>
                            </div>
                        )}
                    </CardContent>
                 </Card>
                 
                 <Card className="flex flex-col">
                    <CardHeader className="p-4 pb-2">
                         <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-3 flex-1">
                        {leads.slice(0, 3).map(lead => (
                            <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors" onClick={() => onOpenLead(lead)}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${lead.interestLevel === 'high' ? 'bg-red-500' : lead.interestLevel === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{lead.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock size={10} /> {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-muted-foreground/50" />
                            </div>
                        ))}
                         <Button variant="ghost" size="sm" className="w-full text-xs mt-auto" onClick={onAddLead}>Ver pipeline completo</Button>
                    </CardContent>
                 </Card>
            </div>

        </div>

        {/* --- RIGHT COLUMN (WIDGETS) --- */}
        <div className="lg:w-80 space-y-6 flex flex-col shrink-0">
            
            {/* iOS Style Calendar Widget */}
            <Card className="border-none shadow-md overflow-hidden bg-white relative">
                <div className="h-1.5 w-full bg-red-500 absolute top-0 left-0" />
                <CardContent className="p-0">
                    <div className="p-4 pb-2">
                        <h3 className="text-lg font-bold text-slate-900 leading-none capitalize">
                            {format(today, "MMMM", { locale: es })}
                        </h3>
                        <p className="text-sm text-muted-foreground font-medium capitalize">
                            {format(today, "EEEE, d", { locale: es })}
                        </p>
                    </div>
                    <div className="flex justify-center pb-2 scale-90 origin-top">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="p-0 pointer-events-none" 
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

            {/* Monthly Goal Widget */}
             <Card className="bg-gradient-to-br from-violet-600 to-fuchsia-700 border-none text-white shadow-md relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-10">
                     <Target size={80} />
                 </div>
                 <CardContent className="p-4 space-y-3 relative z-10">
                     <div className="flex justify-between items-end">
                         <div>
                             <p className="text-xs font-medium text-white/80 uppercase tracking-wider">Objetivo Mensual</p>
                             <h3 className="text-2xl font-bold mt-0.5">${(monthlyRevenue/1000).toFixed(1)}k <span className="text-sm font-normal text-white/70">/ ${(monthlyGoal/1000).toFixed(1)}k</span></h3>
                         </div>
                     </div>
                     <div className="space-y-1.5">
                        <Progress value={monthlyProgress} className="h-2 bg-black/20 [&>*]:bg-white" />
                        <div className="flex justify-between text-[10px] text-white/80 font-medium">
                            <span>Ingresos este mes</span>
                            <span>{monthlyProgress.toFixed(0)}%</span>
                        </div>
                     </div>
                 </CardContent>
             </Card>

        </div>

      </div>

      <AddNoteDialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen} />
      
      {/* Task Expansion Dialog */}
      <Dialog open={!!expandedTask} onOpenChange={(open) => !open && setExpandedTask(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Detalles de la Tarea</DialogTitle>
                <DialogDescription>
                    Creada el {expandedTask && format(expandedTask.createdAt, "PPP", { locale: es })}
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Título</h4>
                    <p className="text-lg font-medium">{expandedTask?.title}</p>
                </div>
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Prioridad</h4>
                    <div className="mt-1">
                        <Badge variant="outline" className="capitalize">
                            {expandedTask?.priority === 'high' ? '🔴 Alta' : expandedTask?.priority === 'medium' ? '🟠 Media' : '⚪ Baja'}
                        </Badge>
                    </div>
                </div>
                {expandedTask?.description && (
                    <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
                        <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap mt-1">
                            {expandedTask.description}
                        </div>
                    </div>
                )}
                {expandedTask?.relatedName && (
                     <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Relacionado con</h4>
                        <p className="text-sm mt-1 flex items-center gap-2">
                             {expandedTask.relatedType === 'student' ? <User size={14} /> : <Target size={14} />}
                             {expandedTask.relatedName}
                        </p>
                    </div>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};