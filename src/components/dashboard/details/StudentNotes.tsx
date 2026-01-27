import React, { useState } from "react";
import { Student } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StickyNote, Plus, Trash2, Loader2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface StudentNotesProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentNotes = ({ student, onUpdate }: StudentNotesProps) => {
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from('student_notes').insert({
        student_id: student.id,
        user_id: user.id,
        content: newNote
      }).select().single();

      if (error) throw error;

      const newStudentNote = {
        id: data.id,
        content: data.content,
        createdAt: new Date(data.created_at)
      };

      onUpdate({ ...student, notes: [newStudentNote, ...student.notes] });
      setNewNote("");
      showSuccess("Nota agregada");
    } catch (error) {
      console.error(error);
      showError("Error al agregar nota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase.from('student_notes').delete().eq('id', noteId);
      if (error) throw error;

      const updatedNotes = student.notes.filter(n => n.id !== noteId);
      onUpdate({ ...student, notes: updatedNotes });
      showSuccess("Nota eliminada");
    } catch (error) {
      showError("Error al eliminar nota");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <StickyNote size={16} /> Notas y Bitácora
      </h3>

      <div className="flex gap-2 items-start">
        <Textarea 
          placeholder="Escribe una nota rápida, actualización o recordatorio..." 
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[80px] text-sm"
        />
        <Button 
            size="icon" 
            onClick={handleAddNote} 
            disabled={isSubmitting || !newNote.trim()}
            className="h-20 w-12 shrink-0"
        >
          {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Plus size={20} />}
        </Button>
      </div>

      <ScrollArea className="h-[250px] w-full rounded-md border p-3 bg-gray-50/50">
        {student.notes.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            No hay notas registradas.
          </div>
        ) : (
          <div className="space-y-3">
            {student.notes.map((note) => (
              <div key={note.id} className="bg-white p-3 rounded-lg border shadow-sm group relative">
                <p className="text-sm whitespace-pre-wrap pr-6 text-slate-700">
                    {note.content}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-2 border-t pt-2">
                    <Calendar size={10} />
                    {format(note.createdAt, "d MMM yyyy, HH:mm", { locale: es })}
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={() => handleDeleteNote(note.id)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};