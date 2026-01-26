import React, { useState, useEffect } from "react";
import { Lead, LeadStatus } from "@/lib/types";
import { LeadKanbanCard } from "./LeadKanbanCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  DndContext, 
  DragOverlay, 
  useSensor, 
  useSensors, 
  MouseSensor, 
  TouchSensor, 
  DragStartEvent, 
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onUpdate: () => void;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; borderColor: string }[] = [
  { id: 'new', title: 'Nuevos', color: 'bg-slate-50/80', borderColor: 'border-slate-200' },
  { id: 'contacted', title: 'Contactados', color: 'bg-blue-50/50', borderColor: 'border-blue-100' },
  { id: 'qualified', title: 'Calificados', color: 'bg-indigo-50/50', borderColor: 'border-indigo-100' },
  { id: 'won', title: 'Ganados', color: 'bg-green-50/50', borderColor: 'border-green-100' },
  { id: 'lost', title: 'Perdidos', color: 'bg-red-50/50', borderColor: 'border-red-100' },
];

// --- Internal Droppable Column Component ---
const DroppableColumn = ({ 
    id, 
    title, 
    color, 
    borderColor, 
    count, 
    children 
}: { 
    id: string; 
    title: string; 
    color: string; 
    borderColor: string; 
    count: number; 
    children: React.ReactNode 
}) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div 
            ref={setNodeRef}
            className={cn(
                "min-w-[280px] w-[300px] shrink-0 flex flex-col rounded-xl border snap-center bg-white/50 backdrop-blur-sm transition-colors",
                borderColor,
                isOver && "ring-2 ring-primary/20 bg-primary/5"
            )}
        >
            {/* Column Header */}
            <div className={cn("p-3 border-b flex items-center justify-between rounded-t-xl", color)}>
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-700">{title}</span>
                    <Badge variant="secondary" className="bg-white/80 text-slate-600 text-[10px] h-5 px-1.5 shadow-sm">
                        {count}
                    </Badge>
                </div>
            </div>

            {/* Column Body */}
            <ScrollArea className="flex-1 p-2 bg-slate-50/30">
                {children}
            </ScrollArea>
        </div>
    );
};

// --- Internal Draggable Card Component ---
const DraggableLead = ({ lead, onClick }: { lead: Lead; onClick: () => void }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: lead.id,
        data: { lead }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.3 : 1, // Visual feedback in original position
        zIndex: isDragging ? 999 : undefined,
    } : undefined;

    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none">
            <LeadKanbanCard lead={lead} onClick={onClick} />
        </div>
    );
};

export const LeadKanban = ({ leads: initialLeads, onLeadClick, onUpdate }: LeadKanbanProps) => {
  // Local state for optimistic updates
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeDragLead, setActiveDragLead] = useState<Lead | null>(null);

  useEffect(() => {
      setLeads(initialLeads);
  }, [initialLeads]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
        activationConstraint: {
            distance: 5, // Avoid accidental drags on simple clicks
        },
    }),
    useSensor(TouchSensor, {
        activationConstraint: {
            delay: 200, // Hold for 200ms to drag on mobile
            tolerance: 5,
        },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
      const lead = event.active.data.current?.lead as Lead;
      setActiveDragLead(lead);
      // Haptic feedback for mobile if supported
      if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLead(null);

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;
    const currentLead = leads.find(l => l.id === leadId);

    if (!currentLead || currentLead.status === newStatus) return;

    // 1. Optimistic Update
    setLeads(prev => prev.map(l => 
        l.id === leadId ? { ...l, status: newStatus } : l
    ));

    // 2. DB Update
    try {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', leadId);

        if (error) throw error;
        
        // Success
        showSuccess(`Lead movido a ${COLUMNS.find(c => c.id === newStatus)?.title}`);
        
        // 3. Sync with parent
        onUpdate();
    } catch (error) {
        console.error(error);
        showError("Error al actualizar estado");
        // Revert on error
        setLeads(initialLeads);
    }
  };

  return (
    <DndContext 
        sensors={sensors} 
        onDragStart={handleDragStart} 
        onDragEnd={handleDragEnd}
        autoScroll={false} // Handle scrolling manually if needed, but simple dnd works well
    >
        <div className="flex h-[calc(100vh-220px)] overflow-x-auto pb-4 gap-4 snap-x snap-mandatory">
        {COLUMNS.map((col) => {
            const colLeads = leads.filter(l => l.status === col.id);
            
            return (
            <DroppableColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                color={col.color} 
                borderColor={col.borderColor} 
                count={colLeads.length}
            >
                {colLeads.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg m-1 bg-slate-50/50">
                        Arrastra aquí
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pb-2">
                        {colLeads.map(lead => (
                            <DraggableLead 
                                key={lead.id} 
                                lead={lead} 
                                onClick={() => onLeadClick(lead)} 
                            />
                        ))}
                    </div>
                )}
            </DroppableColumn>
            );
        })}
        </div>

        {/* Drag Overlay for smooth visual while dragging */}
        {createPortal(
            <DragOverlay>
                {activeDragLead ? (
                    <div className="opacity-90 rotate-2 scale-105 cursor-grabbing">
                        <LeadKanbanCard lead={activeDragLead} onClick={() => {}} />
                    </div>
                ) : null}
            </DragOverlay>,
            document.body
        )}
    </DndContext>
  );
};