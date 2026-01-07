import React, { useState } from "react";
import { Student, Task } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  User 
} from "lucide-react";
import { format } from "date-fns";

interface StudentDetailsProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDetails = ({ student, isOpen, onClose, onUpdateStudent }: StudentDetailsProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  if (!student) return null;

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      completed: false,
    };
    const updatedStudent = {
      ...student,
      tasks: [newTask, ...student.tasks]
    };
    onUpdateStudent(updatedStudent);
    setNewTaskTitle("");
  };

  const toggleTask = (taskId: string) => {
    const updatedTasks = student.tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    onUpdateStudent({ ...student, tasks: updatedTasks });
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = student.tasks.filter(t => t.id !== taskId);
    onUpdateStudent({ ...student, tasks: updatedTasks });
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
              <Badge variant="destructive">Pendiente</Badge>
            )}
          </div>
          <SheetDescription className="text-base font-medium text-foreground/80">
            {student.occupation}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
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
                 Modelo: {student.businessModel.split(" ")[0]}...
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Briefcase size={16} /> Modelo de Negocio
            </h3>
            <div className="p-3 border rounded-md text-sm">
              {student.businessModel}
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
                        onCheckedChange={() => toggleTask(task.id)}
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