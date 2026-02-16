import React, { useState } from "react";
import { MentorTask, TaskPriority } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckSquare, Plus, AlertTriangle, ArrowUpCircle, ArrowDownCircle, User, Target } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TasksListProps {
  mentorTasks: MentorTask[];
  onAddTask: () => void;
  onToggleTask: (task: MentorTask) => void;
}

export const TasksList = ({ mentorTasks, onAddTask, onToggleTask }: TasksListProps) => {
  const [expandedTask, setExpandedTask] = useState<MentorTask | null>(null);

  const priorityOrder: Record<TaskPriority, number> = { high: 3, medium: 2, low: 1 };
  
  // 1. Filtrar completadas (Doble seguridad)
  // 2. Ordenar por prioridad y fecha
  // 3. Limitar a 3 items
  const sortedTasks = mentorTasks
    .filter(t => !t.completed)
    .sort((a, b) => {
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
    })
    .slice(0, 3);

  const getPriorityIcon = (p: TaskPriority) => {
    switch(p) {
        case 'high': return <AlertTriangle size={14} className="text-red-500 shrink-0" />;
        case 'medium': return <ArrowUpCircle size={14} className="text-orange-500 shrink-0" />;
        case 'low': return <ArrowDownCircle size={14} className="text-blue-500 shrink-0" />;
    }
  };

  return (
    <>
    <Card className="flex flex-col border-none shadow-sm">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center justify-between min-h-[50px]">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <CheckSquare size={16} className="text-indigo-500" /> Prioridades
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={onAddTask}>
                <Plus size={12} className="mr-1" /> Nueva
                </Button>
        </CardHeader>
        <CardContent className="p-0">
            {sortedTasks.length === 0 ? (
                <div className="py-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <p className="text-xs">¡Todo listo!</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {sortedTasks.map((task, idx) => (
                        <div 
                            key={task.id} 
                            className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors group ${
                                idx !== sortedTasks.length - 1 ? 'border-b border-slate-100' : ''
                            }`}
                        >
                            <Checkbox 
                                checked={task.completed}
                                onCheckedChange={() => onToggleTask(task)}
                                className="mt-0.5 h-4 w-4"
                            />
                            <div 
                                className="flex-1 min-w-0 cursor-pointer flex items-center justify-between gap-2"
                                onClick={() => setExpandedTask(task)}
                            >
                                <span className="text-sm text-slate-700 truncate font-medium">
                                    {task.title}
                                </span>
                                
                                {getPriorityIcon(task.priority)}
                            </div>
                        </div>
                    ))}
                    
                    <div className="p-2 text-center border-t border-slate-50">
                        <Button variant="link" size="sm" className="h-auto p-0 text-[10px] text-muted-foreground" onClick={onAddTask}>
                            Ver todas las tareas
                        </Button>
                    </div>
                </div>
            )}
        </CardContent>
    </Card>

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
    </>
  );
};