import React, { useEffect } from "react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import { 
  Calculator, 
  Calendar, 
  User, 
  UserPlus, 
  Target, 
  StickyNote, 
  CheckSquare, 
  LayoutDashboard,
  Phone,
  Search,
  Hash
} from "lucide-react";
import { Student, Lead, MentorTask, Note } from "@/lib/types";

interface CommandCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  leads: Lead[];
  mentorTasks: MentorTask[];
  notes: Note[];
  actions: {
    onNavigate: (view: string) => void;
    onAddStudent: () => void;
    onAddLead: () => void;
    onAddTask: () => void;
    onAddNote: () => void;
    onOpenStudent: (student: Student) => void;
    onOpenLead: (lead: Lead) => void;
  };
}

export const CommandCenter = ({ 
  open, 
  onOpenChange, 
  students, 
  leads,
  mentorTasks,
  notes,
  actions 
}: CommandCenterProps) => {

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = (command: () => void) => {
    onOpenChange(false);
    command();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Busca por nombre, ID, contexto o contenido..." />
      <CommandList>
        <CommandEmpty>No se encontraron resultados.</CommandEmpty>
        
        <CommandGroup heading="Acciones Rápidas">
          <CommandItem onSelect={() => runCommand(actions.onAddStudent)}>
            <UserPlus className="mr-2 h-4 w-4" />
            <span>Registrar Nuevo Alumno</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(actions.onAddLead)}>
            <Target className="mr-2 h-4 w-4" />
            <span>Nuevo Lead</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(actions.onAddNote)}>
            <StickyNote className="mr-2 h-4 w-4" />
            <span>Nueva Nota</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Alumnos (Contextual)">
          {students.map((student) => {
            // Contextual Search Keywords
            const searchKeywords = `
                ${student.firstName} ${student.lastName} 
                ${student.email} 
                ${student.occupation} 
                ${student.businessModel} 
                ${student.context} 
                ${student.id}
                ${student.status === 'graduated' ? 'egresado graduado' : 'activo'}
            `.toLowerCase();

            return (
                <CommandItem 
                    key={student.id} 
                    onSelect={() => runCommand(() => actions.onOpenStudent(student))}
                    value={searchKeywords}
                    className="flex flex-col items-start gap-1 py-3"
                >
                    <div className="flex items-center gap-2 w-full">
                        <User className="h-4 w-4 text-blue-500 shrink-0" />
                        <span className="font-medium">{student.firstName} {student.lastName}</span>
                        {student.status === 'graduated' && (
                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded-full ml-auto">Egresado</span>
                        )}
                    </div>
                    <div className="pl-6 text-xs text-muted-foreground line-clamp-1 w-full">
                        {student.occupation} • {student.businessModel}
                    </div>
                </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Pipeline & Leads">
          {leads.map((lead) => {
             const searchKeywords = `
                ${lead.name} 
                ${lead.email} 
                ${lead.phone} 
                ${lead.notes} 
                ${lead.status}
                ${lead.id}
                ${lead.interestLevel === 'high' ? 'hot alto' : ''}
            `.toLowerCase();

            return (
                <CommandItem 
                    key={lead.id} 
                    onSelect={() => runCommand(() => actions.onOpenLead(lead))}
                    value={searchKeywords}
                    className="flex flex-col items-start gap-1 py-3"
                >
                    <div className="flex items-center gap-2 w-full">
                        <Phone className="h-4 w-4 text-orange-500 shrink-0" />
                        <span className="font-medium">{lead.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto capitalize">{lead.status}</span>
                    </div>
                    {lead.notes && (
                        <div className="pl-6 text-xs text-muted-foreground line-clamp-1 w-full italic">
                            "{lead.notes}"
                        </div>
                    )}
                </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandGroup heading="Notas (Contenido)">
             {notes.map((note) => {
                const searchKeywords = `
                    ${note.title} 
                    ${note.content} 
                    ${note.category}
                    ${note.id}
                `.toLowerCase();

                return (
                    <CommandItem 
                        key={note.id} 
                        onSelect={() => runCommand(() => actions.onNavigate('notes'))}
                        value={searchKeywords}
                        className="flex flex-col items-start gap-1 py-3"
                    >
                         <div className="flex items-center gap-2 w-full">
                            <StickyNote className="h-4 w-4 text-yellow-500 shrink-0" />
                            <span className="font-medium">{note.title}</span>
                            <span className="text-[10px] bg-slate-100 px-1.5 rounded text-slate-500 ml-auto">{note.category}</span>
                        </div>
                        <div className="pl-6 text-xs text-muted-foreground line-clamp-1 w-full">
                            {note.content}
                        </div>
                    </CommandItem>
                );
             })}
        </CommandGroup>

         <CommandGroup heading="Tareas Pendientes">
             {mentorTasks.map((task) => {
                const searchKeywords = `
                    ${task.title} 
                    ${task.description} 
                    ${task.priority}
                    ${task.relatedName || ''}
                    ${task.id}
                `.toLowerCase();

                return (
                    <CommandItem 
                        key={task.id} 
                        onSelect={() => runCommand(() => actions.onNavigate('tasks'))}
                        value={searchKeywords}
                         className="flex flex-col items-start gap-1 py-3"
                    >
                         <div className="flex items-center gap-2 w-full">
                            <CheckSquare className="h-4 w-4 text-indigo-500 shrink-0" />
                            <span className="font-medium">{task.title}</span>
                        </div>
                        {task.description && (
                            <div className="pl-6 text-xs text-muted-foreground line-clamp-1 w-full">
                                {task.description}
                            </div>
                        )}
                    </CommandItem>
                );
             })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Navegación General">
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('overview'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Ir al Panel General</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('calendar'))}>
            <Calendar className="mr-2 h-4 w-4" />
            <span>Abrir Calendario</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('goals'))}>
            <Calculator className="mr-2 h-4 w-4" />
            <span>Objetivos Financieros</span>
          </CommandItem>
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
};