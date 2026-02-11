import React, { useState, useRef, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { CanvasItem } from "@/lib/types";

const DRAFT_KEY = "deep-work-draft-v1";

interface DeepWorkCanvasProps {
    onArchive: (items: CanvasItem[]) => Promise<void>;
}

export const DeepWorkCanvas = ({ onArchive }: DeepWorkCanvasProps) => {
  // 1. Inicializar estado leyendo de LocalStorage si existe
  const [items, setItems] = useState<CanvasItem[]>(() => {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
          try {
              return JSON.parse(saved);
          } catch (e) {
              console.error("Error al cargar borrador", e);
          }
      }
      return [{ id: '1', text: '', completed: false }];
  });

  const [isArchiving, setIsArchiving] = useState(false);
  const inputsRef = useRef<Map<string, HTMLInputElement>>(new Map());

  // 2. Guardar en LocalStorage cada vez que items cambie
  useEffect(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(items));
  }, [items]);

  const focusInput = (id: string) => {
      setTimeout(() => {
          const el = inputsRef.current.get(id);
          if (el) el.focus();
      }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number, id: string) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          const newItem = { id: Date.now().toString(), text: '', completed: false };
          const newItems = [...items];
          newItems.splice(index + 1, 0, newItem);
          setItems(newItems);
          focusInput(newItem.id);
      } else if (e.key === 'Backspace' && items[index].text === '' && items.length > 1) {
          e.preventDefault();
          const prevItem = items[index - 1];
          const newItems = items.filter(item => item.id !== id);
          setItems(newItems);
          if (prevItem) focusInput(prevItem.id);
      }
  };

  const handleChange = (text: string, id: string) => {
      setItems(items.map(item => item.id === id ? { ...item, text } : item));
  };

  const toggleComplete = (id: string) => {
      const updatedItems = items.map(item => item.id === id ? { ...item, completed: !item.completed } : item);
      
      // Sort items: Unchecked first, Checked last
      updatedItems.sort((a, b) => {
          if (a.completed === b.completed) return 0;
          return a.completed ? 1 : -1;
      });

      setItems(updatedItems);
  };

  const handlePaste = (e: React.ClipboardEvent, id: string) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;

    const lines = pastedData.split(/\r\n|\r|\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return;

    // Replace current item with first line
    const currentItemIndex = items.findIndex(i => i.id === id);
    const newItems = [...items];
    
    // Create new items from lines
    const createdItems = lines.map((line, idx) => ({
        id: `${Date.now()}-${idx}`,
        text: line,
        completed: false
    }));

    // Splicing: Remove current, insert new ones
    newItems.splice(currentItemIndex, 1, ...createdItems);
    setItems(newItems);
  };

  const handleArchive = async () => {
      // Don't archive empty sessions
      const hasContent = items.some(i => i.text.trim() !== "");
      if (!hasContent) return;

      try {
          setIsArchiving(true);
          await onArchive(items);
          
          // 3. Limpiar estado Y LocalStorage SOLO al archivar con éxito
          const cleanState = [{ id: Date.now().toString(), text: '', completed: false }];
          setItems(cleanState);
          localStorage.removeItem(DRAFT_KEY);
      } catch (error) {
          console.error("Falló el archivado, manteniendo estado local.");
      } finally {
          setIsArchiving(false);
      }
  };

  return (
    <div className="bg-[#fff9e6] min-h-[500px] p-6 sm:p-8 rounded-xl shadow-inner border border-stone-200 relative group/canvas">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-stone-200/20 to-transparent pointer-events-none" />
        
        <div className="flex justify-between items-start mb-6">
            <h3 className="text-stone-400 font-serif italic select-none">Notes & Checklist</h3>
            
            <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleArchive}
                disabled={isArchiving}
                className="text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Finalizar y Archivar Sesión"
            >
                {isArchiving ? <Loader2 className="animate-spin" size={18} /> : <Check size={20} />}
            </Button>
        </div>
        
        <div className="space-y-1">
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 group animate-in slide-in-from-top-1 duration-300">
                    <div className="pt-1.5 self-start">
                        <Checkbox 
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={() => toggleComplete(item.id)}
                            className="rounded-full border-stone-400 data-[state=checked]:bg-stone-500 data-[state=checked]:border-stone-500 h-5 w-5 transition-colors"
                        />
                    </div>
                    <Input
                        ref={(el) => {
                            if (el) inputsRef.current.set(item.id, el);
                            else inputsRef.current.delete(item.id);
                        }}
                        value={item.text}
                        onChange={(e) => handleChange(e.target.value, item.id)}
                        onKeyDown={(e) => handleKeyDown(e, index, item.id)}
                        onPaste={(e) => handlePaste(e, item.id)}
                        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-lg font-medium text-stone-800 placeholder:text-stone-300 transition-all ${
                            item.completed ? 'line-through text-stone-400 decoration-stone-400' : ''
                        }`}
                        placeholder="Escribe o pega tu lista..."
                        autoFocus={index === items.length - 1 && items.length === 1}
                    />
                    <button 
                        onClick={() => {
                            if (items.length > 1) {
                                const newItems = items.filter(i => i.id !== item.id);
                                setItems(newItems);
                            }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all p-1"
                        tabIndex={-1}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
        
        <div 
            className="mt-4 text-stone-400 text-sm flex items-center gap-2 cursor-pointer hover:text-stone-600 transition-colors"
            onClick={() => {
                const newItem = { id: Date.now().toString(), text: '', completed: false };
                setItems([...items, newItem]);
                setTimeout(() => focusInput(newItem.id), 0);
            }}
        >
            <Plus size={16} /> Click para agregar línea
        </div>
    </div>
  );
};