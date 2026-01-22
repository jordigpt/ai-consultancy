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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Calendar,
  User,
  Target,
  Check,
  ChevronsUpDown,
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RelationOption {
    id: string;
    label: string;
    type: 'student' | 'lead';
}

export const MentorTasksView = () => {
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [selectedRelation, setSelectedRelation] = useState<RelationOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Relations Data
  const [relations, setRelations] = useState<RelationOption[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // 1. Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('mentor_tasks')
        .select(`
            *,
            students (id, first_name, last_name),
            leads (id, name)
        `)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (tasksError) throw tasksError;

      const formattedTasks: MentorTask[] = tasksData.map((t: any) => {
        let relatedName = undefined;
        let relatedType: 'student' | 'lead' | undefined = undefined;

        if (t.students) {
            relatedName = `${t.students.first_name} ${t.students.last_name}`;
            relatedType = 'student';
        } else if (t.leads) {
            relatedName = t.leads.name;
            relatedType = 'lead';
        }

        return {
            id: t.id,
            title: t.title,
            description: t.description,
            priority: t.priority,
            completed: t.completed,
            createdAt: new Date(t.created_at),
            studentId: t.student_id,
            leadId: t.lead_id,
            relatedName,
            relatedType
        };
      });

      setTasks(formattedTasks);

      // 2. Fetch Relations (Students & Leads) for the selector
      const { data: studentsData } = await supabase.from('students').select('id, first_name, last_name').eq('status', 'active');
      const { data: leadsData } = await supabase.from('leads').select('id, name').neq('status', 'won').neq('status', 'lost');

      const options: RelationOption[] = [
        ...(studentsData?.map(s => ({
            id: s.id,
            label: `${s.first_name} ${s.last_name}`,
            type: 'student' as const
        })) || []),
        ...(leadsData?.map(l => ({
            id: l.id,
            label: l.name,
            type: 'lead' as const
        })) || [])
      ];
      
      setRelations(options);

    } catch (error) {
      console.error(error);
      showError("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddTask = async () => {
    if (!title.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload: any = {
        user_id: user.id,
        title,
        description,
        priority,
        student_id: selectedRelation?.type === 'student' ? selectedRelation.id : null,
        lead_id: selectedRelation?.type === 'lead' ? selectedRelation.id : null
      };

      const { error } = await supabase.from('mentor_tasks').insert(payload);

      if (error) throw error;

      showSuccess("Tarea personal agregada");
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedRelation(null);
      setIsAddOpen(false);
      fetchData(); // Reload to get the relations populated
    } catch (error) {
      showError("Error al crear tarea");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: MentorTask) => {
    try {
      const updatedTasks = tasks.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed } : t
      );
      setTasks(updatedTasks);

      const { error } = await supabase
        .from('mentor_tasks')
        .update({ completed: !task.completed })
        .eq('id', task.id);

      if (error) {
          fetchData(); 
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
        case 'high': return <Badge variant="destructive" className="gap-1 h-5 text-[10px] px-1.5"><AlertTriangle size={8} /> Alta</Badge>;
        case 'medium': return <Badge variant="secondary" className="bg-orange-100 text-orange-800 hover:bg-orange-200 gap-1 h-5 text-[10px] px-1.5"><ArrowUpCircle size={8} /> Media</Badge>;
        case 'low': return <Badge variant="outline" className="text-muted-foreground gap-1 h-5 text-[10px] px-1.5"><ArrowDownCircle size={8} /> Baja</Badge>;
    }
  };

  if (isLoading) {
      return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  const pendingTasks = tasks.filter(t => !t.completed);

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
            <DialogContent className="overflow-visible">
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

                    <div className="space-y-2 flex flex-col">
                        <label className="text-sm font-medium">Relacionado con (Opcional)</label>
                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                            <PopoverTrigger asChild>
                                <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openCombobox}
                                className="justify-between"
                                >
                                {selectedRelation
                                    ? selectedRelation.label
                                    : "Buscar alumno o lead..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]" align="start">
                                <Command>
                                    <CommandInput placeholder="Buscar..." />
                                    <CommandList>
                                        <CommandEmpty>No encontrado.</CommandEmpty>
                                        <CommandGroup heading="Alumnos">
                                            {relations.filter(r => r.type === 'student').map((relation) => (
                                                <CommandItem
                                                    key={relation.id}
                                                    value={relation.label}
                                                    onSelect={() => {
                                                        setSelectedRelation(relation);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedRelation?.id === relation.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {relation.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Leads">
                                            {relations.filter(r => r.type === 'lead').map((relation) => (
                                                <CommandItem
                                                    key={relation.id}
                                                    value={relation.label}
                                                    onSelect={() => {
                                                        setSelectedRelation(relation);
                                                        setOpenCombobox(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedRelation?.id === relation.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {relation.label}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        {selectedRelation && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                className="self-start h-6 text-xs text-muted-foreground -mt-1"
                                onClick={() => setSelectedRelation(null)}
                            >
                                <X size={12} className="mr-1" /> Quitar selección
                            </Button>
                        )}
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
                    className={`group relative flex items-start gap-3 p-4 rounded-xl border transition-all ${
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
                        <div className="flex items-center justify-between pr-8">
                            <span className={`font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                                {task.title}
                            </span>
                            <div className="flex items-center gap-2">
                                {task.relatedName && (
                                    <Badge variant="outline" className="text-[10px] h-5 bg-blue-50 text-blue-700 border-blue-100 flex items-center gap-1 font-normal">
                                        {task.relatedType === 'student' ? <User size={8} /> : <Target size={8} />}
                                        {task.relatedName}
                                    </Badge>
                                )}
                                {getPriorityBadge(task.priority)}
                            </div>
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
                        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
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