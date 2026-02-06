import React, { useState } from "react";
import { Student, MentorTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentMentorTasksProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentMentorTasks = ({ student, onUpdate }: StudentMentorTasksProps) => {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const mentorTasks = student.mentorTasks || [];

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const newTask = {
        student_id: student.id,
        user_id: user.id,
        title: newTaskTitle,
        priority: 'medium',
        completed: false
      };

      const { data, error } = await supabase.from('mentor_tasks').insert(newTask).select().single();
      if (error) throw error;

      const task: MentorTask = {
        id: data.id,
        title: data.title,
        description: data.description,
        priority: data.priority,
        completed: data.completed,
        createdAt: new Date(data.created_at),
        studentId: data.student_id,
        relatedType: 'student'
      };

      onUpdate({ ...student, mentorTasks: [task, ...mentorTasks] });
      setNewTaskTitle("");
      showSuccess("Tarea de mentor añadida");
    } catch (error) {
      console.error(error);
      showError("Error al guardar tarea");
    }
  };

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('mentor_tasks')
        .update({ completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      const updatedTasks = mentorTasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      onUpdate({ ...student, mentorTasks: updatedTasks });
    } catch (error) {
      showError("Error al actualizar tarea");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('mentor_tasks').delete().eq('id', taskId);
      if (error) throw error;

      const updatedTasks = mentorTasks.filter(t => t.id !== taskId);
      onUpdate({ ...student, mentorTasks: updatedTasks });
    } catch (error) {
      showError("Error al eliminar tarea");
    }
  };

  const completedTasks = mentorTasks.filter(t => t.completed).length;
  const totalTasks = mentorTasks.length;
  const progress = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-indigo-700">
          <Briefcase size={16} /> Mis Tareas (Admin)
        </h3>
        <span className="text-xs text-muted-foreground">
          {completedTasks}/{totalTasks} completadas
        </span>
      </div>
      
      <Progress value={progress} className="h-2 bg-indigo-100 [&>div]:bg-indigo-600" />

      <div className="flex gap-2">
        <Input 
          placeholder="Tarea administrativa para este alumno..." 
          value={newTaskTitle}
          onChange={(e) => setNewTaskTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
          className="text-base border-indigo-100 focus-visible:ring-indigo-500"
        />
        <Button size="icon" onClick={handleAddTask} className="shrink-0 bg-indigo-600 hover:bg-indigo-700">
          <Plus size={18} />
        </Button>
      </div>

      <ScrollArea className="h-[200px] w-full rounded-md border border-indigo-100 bg-indigo-50/20 p-3">
        {mentorTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No tienes tareas administrativas asignadas a este alumno.
          </div>
        ) : (
          <div className="space-y-3">
            {mentorTasks.map((task) => (
              <div key={task.id} className="flex items-start space-x-3 group">
                <Checkbox 
                  id={`mentor-${task.id}`} 
                  checked={task.completed} 
                  onCheckedChange={() => toggleTask(task.id, task.completed)}
                  className="mt-1 border-indigo-400 data-[state=checked]:bg-indigo-600 data-[state=checked]:text-white"
                />
                <label
                  htmlFor={`mentor-${task.id}`}
                  className={`text-sm flex-1 cursor-pointer transition-all leading-snug pt-0.5 ${
                    task.completed ? "line-through text-muted-foreground" : "text-slate-700 font-medium"
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