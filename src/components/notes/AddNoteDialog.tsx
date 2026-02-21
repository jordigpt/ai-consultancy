import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Note } from "@/lib/types";

const DEFAULT_CATEGORIES = ["Reel", "Story", "Guía", "SOP", "Idea", "Otro"];

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteAdded?: () => void;
  noteToEdit?: Note | null;
}

export const AddNoteDialog = ({ open, onOpenChange, onNoteAdded, noteToEdit }: AddNoteDialogProps) => {
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Idea");
  const [customCategory, setCustomCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);

  useEffect(() => {
    if (noteToEdit && open) {
      setNewTitle(noteToEdit.title);
      setNewContent(noteToEdit.content);
      
      if (DEFAULT_CATEGORIES.includes(noteToEdit.category)) {
        setSelectedCategory(noteToEdit.category);
        setIsCustomMode(false);
      } else {
        setSelectedCategory("custom");
        setCustomCategory(noteToEdit.category);
        setIsCustomMode(true);
      }
    } else if (!open) {
      if (!noteToEdit) {
          setNewTitle("");
          setNewContent("");
          setSelectedCategory("Idea");
          setCustomCategory("");
          setIsCustomMode(false);
      }
    }
  }, [noteToEdit, open]);

  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setIsCustomMode(true);
      setSelectedCategory("custom");
    } else {
      setIsCustomMode(false);
      setSelectedCategory(value);
    }
  };

  const handleSaveNote = async () => {
    if (!newTitle.trim()) return;
    
    // Determine final category
    const finalCategory = isCustomMode ? customCategory.trim() : selectedCategory;
    
    if (!finalCategory) {
        showError("La categoría es requerida");
        return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (noteToEdit) {
         const { error } = await supabase
          .from('notes')
          .update({
            title: newTitle,
            content: newContent,
            category: finalCategory,
          })
          .eq('id', noteToEdit.id);
          
         if (error) throw error;
         showSuccess("Nota actualizada");
      } else {
        const { error } = await supabase.from('notes').insert({
          user_id: user.id,
          title: newTitle,
          content: newContent,
          category: finalCategory,
        });

        if (error) throw error;
        showSuccess("Nota guardada en Note Bank");
      }

      setNewTitle("");
      setNewContent("");
      setCustomCategory("");
      setIsCustomMode(false);
      onOpenChange(false);
      if (onNoteAdded) onNoteAdded();
    } catch (error) {
      console.error(error);
      showError("Error al guardar nota");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{noteToEdit ? "Editar Nota" : "Crear Nota Rápida"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Título</label>
            <Input
              placeholder="Ej. Idea para Reel sobre AI..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Categoría</label>
            <div className="flex gap-2">
                <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {DEFAULT_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                        {cat}
                    </SelectItem>
                    ))}
                    <SelectItem value="custom" className="font-semibold text-primary">
                        + Nueva Categoría...
                    </SelectItem>
                </SelectContent>
                </Select>
            </div>
            
            {isCustomMode && (
                <div className="animate-in slide-in-from-top-2">
                    <Input 
                        placeholder="Escribe el nombre de la categoría..."
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="bg-slate-50 border-dashed"
                        autoFocus
                    />
                </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Contenido</label>
            <Textarea
              placeholder="Desarrolla tu idea aquí..."
              className="min-h-[150px]"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
            />
          </div>
          <Button className="w-full" onClick={handleSaveNote} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {noteToEdit ? "Guardar Cambios" : "Guardar Nota"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};