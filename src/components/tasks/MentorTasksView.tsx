import React, { useState, useEffect } from "react";
import { MentorTask } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  CheckSquare, 
  Loader2,
  User,
  Target,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { TaskColumn } from "./TaskColumn";
import { TaskFormDialog, RelationOption } from "./TaskFormDialog";

export const MentorTasksView = () => {
  const [tasks, setTasks] = useState<MentorTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<MentorTask | null>(null);
  
  // Relations Data for Combobox
  const [relations, setRelations] = useState<RelationOption[]>([]);

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

  const handleOpenAdd = () => {
      setEditingTask(null);
      setIsDialogOpen(true);
  };

  const handleOpenEdit = (task: MentorTask) => {
      setEditingTask(task);
      setIsDialogOpen(true);
  };

  const handleSaveTask = async (taskData: {
      title: string;
      description: string;
      priority: any;
      relation: RelationOption | null;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload: any = {
        user_id: user.id,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        student_id: taskData.relation?.type === 'student' ? taskData.relation.id : null,
        lead_id: taskData.relation?.type === 'lead' ? taskData.relation.id : null
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

      fetchData(); 
    } catch (error) {
      showError("Error al guardar tarea");
      throw error; // Re-throw to handle spinner in dialog
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

  if (isLoading) {
      return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>;
  }

  // Filter Tasks for Columns
  const generalTasks = tasks.filter(t => !t.studentId && !t.leadId);
  const studentTasks = tasks.filter(t => !!t.studentId);
  const leadTasks = tasks.filter(t => !!t.leadId);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
                <Briefcase className="text-primary" /> Gestión de Tareas
            </h2>
            <p className="text-sm text-muted-foreground">
                Organiza tus pendientes personales y de seguimiento.
            </p>
        </div>
        
        <Button className="shadow-md" onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" /> Nueva Tarea
        </Button>

        <TaskFormDialog 
            open={isDialogOpen} 
            onOpenChange={setIsDialogOpen} 
            taskToEdit={editingTask} 
            relations={relations} 
            onSave={handleSaveTask}
        />
      </div>

      {/* Grid changed to take full height and better spacing */}
      <div className="flex overflow-x-auto gap-4 flex-1 min-h-0 snap-x snap-mandatory pb-4 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
          <div className="min-w-[85vw] md:min-w-0 snap-center h-full">
            <TaskColumn 
                title="Mis Tareas / General" 
                columnTasks={generalTasks} 
                icon={CheckSquare} 
                colorClass="border-slate-200 text-slate-700" 
                onToggle={toggleTask}
                onEdit={handleOpenEdit}
                onDelete={deleteTask}
            />
          </div>
          <div className="min-w-[85vw] md:min-w-0 snap-center h-full">
            <TaskColumn 
                title="Tareas de Alumnos" 
                columnTasks={studentTasks} 
                icon={User} 
                colorClass="border-blue-200 text-blue-700 bg-blue-50" 
                onToggle={toggleTask}
                onEdit={handleOpenEdit}
                onDelete={deleteTask}
            />
          </div>
          <div className="min-w-[85vw] md:min-w-0 snap-center h-full">
            <TaskColumn 
                title="Tareas de Leads" 
                columnTasks={leadTasks} 
                icon={Target} 
                colorClass="border-orange-200 text-orange-700 bg-orange-50" 
                onToggle={toggleTask}
                onEdit={handleOpenEdit}
                onDelete={deleteTask}
            />
          </div>
      </div>
    </div>
  );
};