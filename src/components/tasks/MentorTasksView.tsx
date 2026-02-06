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
  X,
  Pencil,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RelationOption {
    id: string;
    label: string;
    type: 'student' | 'lead';
}

export const MentorTasksView = () => {
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MentorTask | null>(null);

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

  const resetForm = () => {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setSelectedRelation(null);
      setEditingTask(null);
  };

  const handleOpenAdd = (preselectedType?: 'student' | 'lead' | null) => {
      resetForm();
      // Si quisiéramos preseleccionar el tipo en el futuro, podríamos hacerlo aquí,
      // pero por ahora mantenemos el selector genérico.
      setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: MentorTask) => {
      setEditingTask(task);
      setTitle(task.title);
      setDescription(task.description || "");
      setPriority(task.priority);
      
      if (task.studentId) {
          setSelectedRelation({ id: task.studentId, label: task.relatedName || "", type: 'student' });
      } else if (task.leadId) {
          setSelectedRelation({ id: task.leadId, label: task.relatedName || "", type: 'lead' });
      } else {
          setSelectedRelation(null);
      }
      
      setIsDialogOpen(true);
  };

  const handleSaveTask = async () => {
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

      if (editingTask) {
          const { error } = await supabase
              .from('mentor_tasks')
              .update(payload)
              .eq('id', editingTask.id);
          if (error) throw error;
          showSuccess("Tarea actualizada");
      } else {
          const { error } = await supabase.from('mentor_tasks').insert(payload);
          if (error) throw error;
          showSuccess("Tarea creada");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData(); 
    } catch (error) {
      showError("Error al guardar tarea");
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

  // --- Column Render Helper ---
  const TaskColumn = ({ 
      title, 
      columnTasks, 
      icon: Icon, 
      colorClass 
  }: { 
      title: string; 
      columnTasks: MentorTask[]; 
      icon: any; 
      colorClass: string 
  }) => (
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
                          <div 
                            key={task.id} 
                            className={cn(
                                "group relative flex items-start gap-3 p-3 rounded-lg border transition-all bg-white shadow-sm hover:shadow-md",
                                task.completed && "opacity-60 bg-slate-50"
                            )}
                          >
                                <Checkbox 
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTask(task)}
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
                                        onClick={() => handleOpenEdit(task)}
                                    >
                                        <Pencil size={12} />
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteTask(task.id)}
                                    >
                                        <Trash2 size={12} />
                                    </Button>
                                </div>
                          </div>
                      ))}
                  </div>
              )}
          </ScrollArea>
      </div>
  );

  if (isLoading) {
      return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  // Filter Tasks for Columns
  const generalTasks = tasks.filter(t => !t.studentId && !t.leadId);
  const studentTasks = tasks.filter(t => !!t.studentId);
  const leadTasks = tasks.filter(t => !!t.leadId);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="text-primary" /> Gestión de Tareas
            </h2>
            <p className="text-sm text-muted-foreground">
                Organiza tus pendientes personales y de seguimiento.
            </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-md" onClick={() => handleOpenAdd()}>
                    <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
                </Button>
            </DialogTrigger>
            <DialogContent className="overflow-visible">
                <DialogHeader>
                    <DialogTitle>{editingTask ? "Editar Tarea" : "Agregar Tarea"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Título</label>
                        <Input 
                            placeholder="Ej. Revisar métricas..." 
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
                                <X size={12} className="mr-1" /> Quitar selección (Hacer General)
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
                    <Button className="w-full" onClick={handleSaveTask} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {editingTask ? "Guardar Cambios" : "Crear Tarea"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          <TaskColumn 
            title="Mis Tareas / General" 
            columnTasks={generalTasks} 
            icon={CheckSquare} 
            colorClass="border-slate-200 text-slate-700" 
          />
          <TaskColumn 
            title="Tareas de Alumnos" 
            columnTasks={studentTasks} 
            icon={User} 
            colorClass="border-blue-200 text-blue-700 bg-blue-50" 
          />
          <TaskColumn 
            title="Tareas de Leads" 
            columnTasks={leadTasks} 
            icon={Target} 
            colorClass="border-orange-200 text-orange-700 bg-orange-50" 
          />
      </div>
    </div>
  );
};