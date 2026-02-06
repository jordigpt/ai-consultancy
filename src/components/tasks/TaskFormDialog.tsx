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
import { Loader2, ChevronsUpDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RelationOption {
    id: string;
    label: string;
    type: 'student' | 'lead';
}

interface TaskFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskToEdit: MentorTask | null;
  relations: RelationOption[];
  onSave: (taskData: {
    title: string;
    description: string;
    priority: TaskPriority;
    relation: RelationOption | null;
  }) => Promise<void>;
}

export const TaskFormDialog = ({ 
    open, 
    onOpenChange, 
    taskToEdit, 
    relations, 
    onSave 
}: TaskFormDialogProps) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<TaskPriority>("medium");
    const [selectedRelation, setSelectedRelation] = useState<RelationOption | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    useEffect(() => {
        if (open) {
            if (taskToEdit) {
                setTitle(taskToEdit.title);
                setDescription(taskToEdit.description || "");
                setPriority(taskToEdit.priority);
                
                if (taskToEdit.studentId) {
                    setSelectedRelation({ id: taskToEdit.studentId, label: taskToEdit.relatedName || "", type: 'student' });
                } else if (taskToEdit.leadId) {
                    setSelectedRelation({ id: taskToEdit.leadId, label: taskToEdit.relatedName || "", type: 'lead' });
                } else {
                    setSelectedRelation(null);
                }
            } else {
                // Reset form for new task
                setTitle("");
                setDescription("");
                setPriority("medium");
                setSelectedRelation(null);
            }
        }
    }, [open, taskToEdit]);

    const handleSubmit = async () => {
        if (!title.trim()) return;
        
        setIsSubmitting(true);
        try {
            await onSave({
                title,
                description,
                priority,
                relation: selectedRelation
            });
            onOpenChange(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="overflow-visible">
                <DialogHeader>
                    <DialogTitle>{taskToEdit ? "Editar Tarea" : "Agregar Tarea"}</DialogTitle>
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
                    <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {taskToEdit ? "Guardar Cambios" : "Crear Tarea"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};