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
  Settings, 
  User, 
  UserPlus, 
  Target, 
  StickyNote, 
  CheckSquare, 
  LayoutDashboard,
  Phone
} from "lucide-react";
import { Student, Lead } from "@/lib/types";

interface CommandCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  students: Student[];
  leads: Lead[];
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
  actions 
}: CommandCenterProps) => {

  // Keyboard Shortcut Listener (Cmd+K / Ctrl+K)
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
      <CommandInput placeholder="Escribe un comando o busca..." />
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
          <CommandItem onSelect={() => runCommand(actions.onAddTask)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            <span>Crear Tarea</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(actions.onAddNote)}>
            <StickyNote className="mr-2 h-4 w-4" />
            <span>Nueva Nota</span>
          </CommandItem>
        </CommandGroup>
        
        <CommandSeparator />
        
        <CommandGroup heading="Navegación">
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('overview'))}>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            <span>Ir al Panel General</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('active'))}>
            <User className="mr-2 h-4 w-4" />
            <span>Ver Alumnos Activos</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => actions.onNavigate('leads'))}>
            <Target className="mr-2 h-4 w-4" />
            <span>Ver Pipeline de Leads</span>
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

        <CommandSeparator />

        <CommandGroup heading="Alumnos">
          {students.map((student) => (
            <CommandItem 
                key={student.id} 
                onSelect={() => runCommand(() => actions.onOpenStudent(student))}
                value={`alumno student ${student.firstName} ${student.lastName}`}
            >
                <div className="flex items-center gap-2 w-full">
                    <User className="mr-2 h-4 w-4 text-blue-500" />
                    <span className="flex-1">{student.firstName} {student.lastName}</span>
                    {student.status === 'graduated' && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 rounded-full">Egresado</span>
                    )}
                </div>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Leads">
          {leads.map((lead) => (
            <CommandItem 
                key={lead.id} 
                onSelect={() => runCommand(() => actions.onOpenLead(lead))}
                value={`lead prospecto ${lead.name}`}
            >
                <div className="flex items-center gap-2">
                    <Phone className="mr-2 h-4 w-4 text-orange-500" />
                    <span>{lead.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">({lead.status})</span>
                </div>
            </CommandItem>
          ))}
        </CommandGroup>

      </CommandList>
    </CommandDialog>
  );
};