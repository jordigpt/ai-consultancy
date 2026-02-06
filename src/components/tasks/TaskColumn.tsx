import React from "react";
import { MentorTask } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TaskCard } from "./TaskCard";
import { LucideIcon } from "lucide-react";

interface TaskColumnProps {
  title: string;
  columnTasks: MentorTask[];
  icon: LucideIcon;
  colorClass: string;
  onToggle: (task: MentorTask) => void;
  onEdit: (task: MentorTask) => void;
  onDelete: (taskId: string) => void;
}

export const TaskColumn = ({ 
  title, 
  columnTasks, 
  icon: Icon, 
  colorClass,
  onToggle,
  onEdit,
  onDelete
}: TaskColumnProps) => {
  return (
      <div className="flex flex-col h-full bg-slate-50/50 border rounded-xl overflow-hidden">
          <div className={cn("p-3 border-b flex items-center justify-between bg-white", colorClass)}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                  <Icon size={16} /> {title}
              </h3>
              <Badge variant="secondary" className="text-xs">{columnTasks.filter(t => !t.completed).length}</Badge>
          </div>
          <ScrollArea className="flex-1 p-3">
              {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs border-2 border-dashed rounded-lg">
                      No hay tareas en esta sección.
                  </div>
              ) : (
                  <div className="space-y-3">
                      {columnTasks.map(task => (
                          <TaskCard 
                            key={task.id} 
                            task={task} 
                            onToggle={onToggle}
                            onEdit={onEdit}
                            onDelete={onDelete}
                          />
                      ))}
                  </div>
              )}
          </ScrollArea>
      </div>
  );
};