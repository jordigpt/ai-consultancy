import React, { useState } from "react";
import { Student, Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Plus, Trash2, Pencil, Check, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentTasksProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentTasks = ({ student, onUpdate }: StudentTasksProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // Edit States
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Grouped Tasks
  const pendingTasks = student.tasks.filter(t => !t.completed);
  const completedTasksList = student.tasks.filter(t => t.completed);

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
      // Sort: Completed tasks will naturally move if we resort, but here we just update state.
      // The rendering logic handles the grouping.
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

  const startEditing = (task: Task) => {
      setEditingTaskId(task.id);
      setEditTitle(task.title);
  };

  const saveEdit = async () => {
      if (!editingTaskId || !editTitle.trim()) return;
      try {
          const { error } = await supabase
            .from('tasks')
            .update({ title: editTitle })
            .eq('id', editingTaskId);
            
          if (error) throw error;

          const updatedTasks = student.tasks.map(t => 
            t.id === editingTaskId ? { ...t, title: editTitle } : t
          );
          onUpdate({ ...student, tasks: updatedTasks });
          setEditingTaskId(null);
          showSuccess("Tarea actualizada");
      } catch (error) {
          showError("Error al editar tarea");
      }
  };

  const cancelEdit = () => {
      setEditingTaskId(null);
      setEditTitle("");
  };

  const completedCount = completedTasksList.length;
  const totalTasks = student.tasks.length;
  const progress = totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-start space-x-3 group min-h-[32px]">
        <Checkbox 
            id={task.id} 
            checked={task.completed} 
            onCheckedChange={() => toggleTask(task.id, task.completed)}
            className="mt-1"
        />
        
        {editingTaskId === task.id ? (
            <div className="flex-1 flex items-center gap-1">
                <Input 
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={saveEdit}>
                    <Check size={14} />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={cancelEdit}>
                    <X size={14} />
                </Button>
            </div>
        ) : (
            <label
                htmlFor={task.id}
                className={`text-sm flex-1 cursor-pointer transition-all leading-snug pt-0.5 ${
                task.completed ? "line-through text-muted-foreground" : ""
                }`}
            >
                {task.title}
            </label>
        )}

        {editingTaskId !== task.id && (
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-blue-600"
                    onClick={() => startEditing(task)}
                >
                    <Pencil size={12} />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteTask(task.id)}
                >
                    <Trash2 size={12} />
                </Button>
            </div>
        )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <CheckCircle2 size={16} /> Tareas Pendientes
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalTasks} completadas
        </span>
      </div>
      
      <Progress value={progress} className="h-2" />

      <div className="flex gap-2">
        <Input 
          placeholder="Nueva tarea..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          className="text-base"
        />
        <Button size="icon" onClick={handleAddTask} className="shrink-0">
          <Plus size={18} />
        </Button>
      </div>

      <ScrollArea className="h-[300px] w-full rounded-md border p-3">
        {student.tasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No hay tareas asignadas aún.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Pending Tasks */}
            <div className="space-y-3">
                {pendingTasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>

            {/* Separator if both lists have items */}
            {pendingTasks.length > 0 && completedTasksList.length > 0 && (
                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground flex items-center gap-1">
                           <ChevronDown size={10} /> Completadas
                        </span>
                    </div>
                </div>
            )}

            {/* Completed Tasks */}
             <div className="space-y-3 opacity-60">
                {completedTasksList.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};