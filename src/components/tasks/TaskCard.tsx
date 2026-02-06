import React from "react";
import { MentorTask, TaskPriority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  AlertTriangle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Calendar,
  User,
  Target,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: MentorTask;
  onToggle: (task: MentorTask) => void;
  onEdit: (task: MentorTask) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard = ({ task, onToggle, onEdit, onDelete }: TaskCardProps) => {
  const getPriorityBadge = (p: TaskPriority) => {
    switch(p) {
        case 'high': return <Badge variant="destructive" className="gap-1 h-5 text-[10px] px-1.5"><AlertTriangle size={8} /> Alta</Badge>;
        case 'medium': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 gap-1 h-5 text-[10px] px-1.5"><ArrowUpCircle size={8} /> Media</Badge>;
        case 'low': return <Badge variant="outline" className="text-muted-foreground gap-1 h-5 text-[10px] px-1.5"><ArrowDownCircle size={8} /> Baja</Badge>;
    }
  };

  return (
    <div 
        className={cn(
            "group relative flex items-start gap-3 p-3 rounded-lg border transition-all bg-white shadow-sm hover:shadow-md",
            task.completed && "opacity-60 bg-slate-50"
        )}
    >
        <Checkbox 
            checked={task.completed}
            onCheckedChange={() => onToggle(task)}
            className="mt-1"
        />
        <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
                <span className={cn("text-sm font-medium leading-snug", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                </span>
            </div>
            
            {task.relatedName && (
                <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        {task.relatedType === 'student' ? <User size={10} /> : <Target size={10} />}
                        <span className="truncate">{task.relatedName}</span>
                </div>
            )}

            {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                </p>
            )}
            
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {format(task.createdAt, "d MMM", { locale: es })}</span>
                </div>
                {getPriorityBadge(task.priority)}
            </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 rounded-md">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-blue-500"
                onClick={() => onEdit(task)}
            >
                <Pencil size={12} />
            </Button>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(task.id)}
            >
                <Trash2 size={12} />
            </Button>
        </div>
    </div>
  );
};