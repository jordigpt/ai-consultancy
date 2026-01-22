import React, { useState, useEffect } from "react";
import { MentorTask, TaskPriority } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Trash2, 
  CheckSquare, 
  AlertTriangle, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Loader2,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export const MentorTasksView = () => {
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('mentor_tasks')
        .select('*')
        .order('completed', { ascending: true }) // Primero las no completadas
        .order('created_at', { ascending: false }); // Luego las más nuevas

      if (error) throw error;

      const formattedTasks: MentorTask[] = data.map((t: any) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        completed: t.completed,
        createdAt: new Date(t.created_at)
      }));

      setTasks(formattedTasks);
    } catch (error) {
      console.error(error);
      showError("Error al cargar tareas");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('mentor_tasks').insert({
        user_id: user.id,
        title,
        description,
        priority
      });

      if (error) throw error;

      showSuccess("Tarea personal agregada");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setIsAddOpen(false);
      fetchTasks();
    } catch (error) {
      showError("Error al crear tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: MentorTask) => {
    try {
      // Optimistic Update
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);

      const { error } = await supabase
        .from('mentor_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) {
          fetchTasks(); // Revert on error
          throw error;
      }
    } catch (error) {
      showError("Error al actualizar tarea");
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase.from('mentor_tasks').delete().eq('id', taskId);
      if (error) throw error;
      
      setTasks(tasks.filter(t => t.id !== taskId));
      showSuccess("Tarea eliminada");
    } catch (error) {
      showError("Error al eliminar");
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch(p) {
        case 'high': return <Badge variant="destructive" className="gap-1"><AlertTriangle size={10} /> Alta</Badge>;
        case 'medium': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 gap-1"><ArrowUpCircle size={10} /> Media</Badge>;
        case 'low': return <Badge variant="outline" className="text-muted-foreground gap-1"><ArrowDownCircle size={10} /> Baja</Badge>;
    }
  };

  if (isLoading) {
      return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <CheckSquare className="text-primary" /> Mis Tareas
            </h2>
            <p className="text-sm text-muted-foreground">
                {pendingTasks.length} pendientes
            </p>
        </div>
        
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Agregar Tarea Personal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input 
                            placeholder="Ej. Revisar entregables de Juan..." 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Prioridad</label>
                        <Select value={priority} onValueChange={(val) => setPriority(val as TaskPriority)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="high">🔴 Alta Prioridad</SelectItem>
                                <SelectItem value="medium">🟠 Media</SelectItem>
                                <SelectItem value="low">⚪ Baja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Descripción / Notas</label>
                        <Textarea 
                            placeholder="Detalles adicionales..." 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <Button className="w-full" onClick={handleAddTask} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Tarea
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50/50">
                <p className="text-muted-foreground">No tienes tareas pendientes.</p>
                <Button variant="link" onClick={() => setIsAddOpen(true)}>Crear la primera</Button>
            </div>
        ) : (
            tasks.map((task) => (
                <div 
                    key={task.id} 
                    className={`group flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        task.completed 
                            ? "bg-gray-50 opacity-60" 
                            : "bg-white hover:border-primary/40 hover:shadow-sm"
                    }`}
                >
                    <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => toggleTask(task)}
                        className="mt-1"
                    />
                    
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                            <span className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                            </span>
                            {getPriorityBadge(task.priority)}
                        </div>
                        
                        {task.description && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {task.description}
                            </p>
                        )}
                        
                        <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            <span>{format(task.createdAt, "d MMM", { locale: es })}</span>
                        </div>
                    </div>

                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                        onClick={() => deleteTask(task.id)}
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};