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
import { Loader2 } from "lucide-react";
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
  const [newCategory, setNewCategory] = useState("Idea");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (noteToEdit && open) {
      setNewTitle(noteToEdit.title);
      setNewContent(noteToEdit.content);
      setNewCategory(noteToEdit.category);
    } else if (!open) {
      // Reset only when closing to avoid flickering if switching modes quickly
      // or optionally reset when opening in 'add' mode, but parent handles that usually.
      if (!noteToEdit) {
          setNewTitle("");
          setNewContent("");
          setNewCategory("Idea");
      }
    }
  }, [noteToEdit, open]);

  const handleSaveNote = async () => {
    if (!newTitle.trim()) return;

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
            category: newCategory,
          })
          .eq('id', noteToEdit.id);
          
         if (error) throw error;
         showSuccess("Nota actualizada");
      } else {
        const { error } = await supabase.from('notes').insert({
          user_id: user.id,
          title: newTitle,
          content: newContent,
          category: newCategory,
        });

        if (error) throw error;
        showSuccess("Nota guardada en Note Bank");
      }

      setNewTitle("");
      setNewContent("");
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
            <Select value={newCategory} onValueChange={setNewCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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