import React, { useState, useRef, useEffect } from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";

interface CanvasItem {
    id: string;
    text: string;
    completed: boolean;
}

export const DeepWorkCanvas = () => {
  const [items, setItems] = useState<CanvasItem[]>([
      { id: '1', text: '', completed: false }
  ]);
  const inputsRef = useRef<Map<string, HTMLInputElement>>(new Map());

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
      setItems(items.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
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

  return (
    <div className="bg-[#fff9e6] min-h-[500px] p-6 sm:p-8 rounded-xl shadow-inner border border-stone-200 relative">
        <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-stone-200/20 to-transparent pointer-events-none" />
        
        <h3 className="text-stone-400 font-serif italic mb-6 select-none">Notes & Checklist</h3>
        
        <div className="space-y-1">
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-3 group">
                    <div className="pt-1.5 self-start">
                        <Checkbox 
                            id={item.id}
                            checked={item.completed}
                            onCheckedChange={() => toggleComplete(item.id)}
                            className="rounded-full border-stone-400 data-[state=checked]:bg-stone-500 data-[state=checked]:border-stone-500 h-5 w-5"
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
                        className={`border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-1 text-lg font-medium text-stone-800 placeholder:text-stone-300 ${
                            item.completed ? 'line-through text-stone-400 decoration-stone-400' : ''
                        }`}
                        placeholder="Escribe o pega tu lista..."
                        autoFocus={index === items.length - 1 && items.length === 1}
                    />
                    <button 
                        onClick={() => {
                            if (items.length > 1) {
                                setItems(items.filter(i => i.id !== item.id));
                            }
                        }}
                        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-400 transition-all p-1"
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