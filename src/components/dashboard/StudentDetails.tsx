import React, { useState } from "react";
import { Student, Task, Call } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  BrainCircuit, 
  Briefcase, 
  CalendarDays, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  User,
  Phone,
  DollarSign
} from "lucide-react";
import { format } from "date-fns";
import { showSuccess, showError } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";

interface StudentDetailsProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDetails = ({ student, isOpen, onClose, onUpdateStudent }: StudentDetailsProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newCallDate, setNewCallDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  if (!student) return null;

  // --- Logic Tareas ---
  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newTask = {
            student_id: student.id,
            user_id: user.id,
            title: newTaskTitle,
            completed: false
        };

        const { data, error } = await supabase.from('tasks').insert(newTask).select().single();
        if (error) throw error;

        // Optimistic update
        const task: Task = {
            id: data.id,
            title: data.title,
            completed: data.completed
        };

        onUpdateStudent({ ...student, tasks: [task, ...student.tasks] });
        setNewTaskTitle("");
        showSuccess("Tarea añadida");
    } catch (error) {
        console.error(error);
        showError("Error al guardar tarea");
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
        const { error } = await supabase
            .from('tasks')
            .update({ completed: !currentStatus })
            .eq('id', taskId);

        if (error) throw error;

        // Optimistic update
        const updatedTasks = student.tasks.map(t => 
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        onUpdateStudent({ ...student, tasks: updatedTasks });
    } catch (error) {
        showError("Error al actualizar tarea");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
        const { error } = await supabase.from('tasks').delete().eq('id', taskId);
        if (error) throw error;

        const updatedTasks = student.tasks.filter(t => t.id !== taskId);
        onUpdateStudent({ ...student, tasks: updatedTasks });
    } catch (error) {
        showError("Error al eliminar tarea");
    }
  };

  // --- Logic Llamadas ---
  const handleScheduleCall = async () => {
    if (!newCallDate) return;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const newCallData = {
            student_id: student.id,
            user_id: user.id,
            date: newCallDate.toISOString(),
            completed: false
        };

        const { data, error } = await supabase.from('calls').insert(newCallData).select().single();
        if (error) throw error;

        const newCall: Call = {
            id: data.id,
            date: new Date(data.date),
            completed: data.completed
        };

        const updatedCalls = [...student.calls, newCall].sort((a, b) => b.date.getTime() - a.date.getTime());
        onUpdateStudent({ ...student, calls: updatedCalls });
        
        setNewCallDate(undefined);
        setIsCalendarOpen(false);
        showSuccess("Llamada agendada");
    } catch (error) {
        console.error(error);
        showError("Error al agendar llamada");
    }
  };

  const deleteCall = async (callId: string) => {
    try {
        const { error } = await supabase.from('calls').delete().eq('id', callId);
        if (error) throw error;

        const updatedCalls = student.calls.filter(c => c.id !== callId);
        onUpdateStudent({ ...student, calls: updatedCalls });
    } catch (error) {
        showError("Error al eliminar llamada");
    }
  };

  const completedTasks = student.tasks.filter(t => t.completed).length;
  const totalTasks = student.tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              {student.firstName} {student.lastName}
            </SheetTitle>
            {student.paidInFull ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagado</Badge>
            ) : (
              <Badge variant="destructive">Deuda: ${student.amountOwed}</Badge>
            )}
          </div>
          <SheetDescription className="text-base font-medium text-foreground/80">
            {student.occupation}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Finanzas Detalladas (si aplica) */}
          {!student.paidInFull && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-2">
               <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
                 <DollarSign size={14} /> Estado de Cuenta
               </h4>
               <div className="flex justify-between text-sm">
                 <span className="text-red-600">Pagado:</span>
                 <span className="font-mono font-medium">${student.amountPaid}</span>
               </div>
               <div className="flex justify-between text-sm">
                 <span className="text-red-600">Restante:</span>
                 <span className="font-mono font-bold text-red-700">${student.amountOwed}</span>
               </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                <BrainCircuit size={14} /> Nivel IA
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold">{student.aiLevel}</span>
                <span className="text-sm text-muted-foreground mb-1">/10</span>
              </div>
              <Progress value={student.aiLevel * 10} className="h-1.5" />
            </div>

            <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase font-bold">
                <CalendarDays size={14} /> Inicio
              </div>
              <div className="text-sm font-semibold">
                {format(student.startDate, "dd MMM, yyyy")}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                 {student.businessModel}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User size={16} /> Contexto
            </h3>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
              {student.context || "Sin contexto adicional."}
            </div>
          </div>

          <Separator />

          {/* Sección de Llamadas */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Phone size={16} /> Llamadas / Consultoría
              </h3>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus size={14} className="mr-1" /> Agendar
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                   <div className="p-3 border-b bg-muted/50">
                     <p className="text-sm font-medium">Seleccionar fecha</p>
                   </div>
                   <Calendar
                      mode="single"
                      selected={newCallDate}
                      onSelect={setNewCallDate}
                      initialFocus
                   />
                   <div className="p-2">
                     <Button className="w-full" size="sm" onClick={handleScheduleCall} disabled={!newCallDate}>
                       Confirmar Agendamiento
                     </Button>
                   </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
               {student.calls && student.calls.length > 0 ? (
                 student.calls.map(call => (
                   <div key={call.id} className="flex items-center justify-between p-3 border rounded-lg bg-white shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                          <Phone size={14} />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{format(call.date, "EEEE, d MMMM")}</p>
                          <p className="text-xs text-muted-foreground">Llamada de seguimiento</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteCall(call.id)}>
                        <Trash2 size={14} />
                      </Button>
                   </div>
                 ))
               ) : (
                 <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                   No hay llamadas programadas.
                 </div>
               )}
            </div>
          </div>

          <Separator />

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} /> Tareas Pendientes
              </h3>
              <span className="text-xs text-muted-foreground">
                {completedTasks}/{totalTasks} completadas
              </span>
            </div>
            
            <Progress value={progress} className="h-2" />

            <div className="flex gap-2">
              <Input 
                placeholder="Nueva tarea (ej. Crear MVP)" 
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <Button size="icon" onClick={handleAddTask}>
                <Plus size={18} />
              </Button>
            </div>

            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              {student.tasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No hay tareas asignadas aún.
                </div>
              ) : (
                <div className="space-y-3">
                  {student.tasks.map((task) => (
                    <div key={task.id} className="flex items-center space-x-2 group">
                      <Checkbox 
                        id={task.id} 
                        checked={task.completed} 
                        onCheckedChange={() => toggleTask(task.id, task.completed)}
                      />
                      <label
                        htmlFor={task.id}
                        className={`text-sm flex-1 cursor-pointer transition-all ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.title}
                      </label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => deleteTask(task.id)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};