import React, { useState } from "react";
import { Student, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentTasksProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentTasks = ({ student, onUpdate }: StudentTasksProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");

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

      const task: Task = {
        id: data.id,
        title: data.title,
        completed: data.completed
      };

      onUpdate({ ...student, tasks: [task, ...student.tasks] });
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

      const updatedTasks = student.tasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      onUpdate({ ...student, tasks: updatedTasks });
    } catch (error) {
      showError("Error al actualizar tarea");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;

      const updatedTasks = student.tasks.filter(t => t.id !== taskId);
      onUpdate({ ...student, tasks: updatedTasks });
    } catch (error) {
      showError("Error al eliminar tarea");
    }
  };

  const completedTasks = student.tasks.filter(t => t.completed).length;
  const totalTasks = student.tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <CheckCircle2 size={16} /> Tareas Pendientes
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedTasks}/{totalTasks} completadas
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />

      <div className="flex gap-2">
        <Input 
          placeholder="Nueva tarea..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          className="text-base" // prevents zoom on iOS
        />
        <Button size="icon" onClick={handleAddTask} className="shrink-0">
          <Plus size={18} />
        </Button>
      </div>

      <ScrollArea className="h-[250px] w-full rounded-md border p-3">
        {student.tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No hay tareas asignadas aún.
          </div>
        ) : (
          <div className="space-y-3">
            {student.tasks.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 group">
                <Checkbox 
                  id={task.id} 
                  checked={task.completed} 
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  className="mt-1"
                />
                <label
                  htmlFor={task.id}
                  className={`text-sm flex-1 cursor-pointer transition-all leading-snug pt-0.5 ${
                    task.completed ? "line-through text-muted-foreground" : ""
                  }`}
                >
                  {task.title}
                </label>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0"
                  onClick={() => deleteTask(task.id)}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};