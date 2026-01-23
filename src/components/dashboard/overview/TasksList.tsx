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
    <>
    <Card className="flex flex-col h-full">
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