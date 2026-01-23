import React, { useState, useEffect } from "react";
import { Note } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, StickyNote, Filter, Trash2, Pin, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const DEFAULT_CATEGORIES = ["Reel", "Story", "Guía", "SOP", "Idea", "Otro"];

export const NotesView = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "all">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("Idea");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotes: Note[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        content: n.content,
        category: n.category,
        isPinned: n.is_pinned,
        createdAt: new Date(n.created_at)
      }));

      setNotes(formattedNotes);
    } catch (error) {
      console.error(error);
      showError("Error al cargar notas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleAddNote = async () => {
    if (!newTitle.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('notes').insert({
        user_id: user.id,
        title: newTitle,
        content: newContent,
        category: newCategory,
      });

      if (error) throw error;

      showSuccess("Nota creada");
      setNewTitle("");
      setNewContent("");
      setIsAddOpen(false);
      fetchNotes();
    } catch (error) {
      showError("Error al crear nota");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (error) throw error;
      setNotes(notes.filter(n => n.id !== id));
      showSuccess("Nota eliminada");
    } catch (error) {
      showError("Error al eliminar");
    }
  };

  const togglePin = async (note: Note) => {
    try {
      // Optimistic update
      const updatedNotes = notes.map(n => 
        n.id === note.id ? { ...n, isPinned: !n.isPinned } : n
      ).sort((a, b) => (b.isPinned === a.isPinned ? 0 : b.isPinned ? 1 : -1)); // Re-sort locally
      
      setNotes(updatedNotes);

      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !note.isPinned })
        .eq('id', note.id);

      if (error) throw error;
    } catch (error) {
        showError("Error al actualizar");
        fetchNotes(); // Revert on error
    }
  };

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || n.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Reel': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Story': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'Guía': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'SOP': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <StickyNote className="text-yellow-500" /> Note Bank
            </h2>
            <p className="text-muted-foreground text-sm">Captura tus ideas, guiones y procesos.</p>
        </div>

        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
                <Button className="shadow-md">
                    <Plus className="mr-2 h-4 w-4" /> Nueva Nota
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Crear Nota</DialogTitle>
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
                                {DEFAULT_CATEGORIES.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                    <Button className="w-full" onClick={handleAddNote} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Nota
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
                placeholder="Buscar en notas..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
             <Button 
                variant={selectedCategory === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="rounded-full"
            >
                Todas
            </Button>
            {DEFAULT_CATEGORIES.map(cat => (
                <Button 
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-full whitespace-nowrap"
                >
                    {cat}
                </Button>
            ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border-2 border-dashed">
            <StickyNote className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">No hay notas</h3>
            <p className="text-muted-foreground text-sm">Comienza agregando tu primera idea.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
                <Card key={note.id} className={`group hover:shadow-md transition-all relative ${note.isPinned ? 'border-yellow-200 bg-yellow-50/30' : ''}`}>
                    <CardHeader className="p-4 pb-2">
                        <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className={`${getCategoryColor(note.category)}`}>
                                {note.category}
                            </Badge>
                            <div className="flex gap-1">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-6 w-6 ${note.isPinned ? 'text-yellow-500' : 'text-muted-foreground hover:text-yellow-500'}`}
                                    onClick={() => togglePin(note)}
                                >
                                    <Pin size={14} className={note.isPinned ? "fill-yellow-500" : ""} />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDelete(note.id)}
                                >
                                    <Trash2 size={14} />
                                </Button>
                            </div>
                        </div>
                        <CardTitle className="text-lg leading-tight">{note.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
                            {note.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-4 text-right">
                            {formatDistanceToNow(note.createdAt, { addSuffix: true, locale: es })}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
      )}
    </div>
  );
};