import React from "react";
import { Lead, LeadStatus } from "@/lib/types";
import { LeadKanbanCard } from "./LeadKanbanCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const COLUMNS: { id: LeadStatus; title: string; color: string; borderColor: string }[] = [
  { id: 'new', title: 'Nuevos', color: 'bg-slate-50/80', borderColor: 'border-slate-200' },
  { id: 'contacted', title: 'Contactados', color: 'bg-blue-50/50', borderColor: 'border-blue-100' },
  { id: 'qualified', title: 'Calificados', color: 'bg-indigo-50/50', borderColor: 'border-indigo-100' },
  { id: 'won', title: 'Ganados', color: 'bg-green-50/50', borderColor: 'border-green-100' },
  { id: 'lost', title: 'Perdidos', color: 'bg-red-50/50', borderColor: 'border-red-100' },
];

export const LeadKanban = ({ leads, onLeadClick }: LeadKanbanProps) => {
  return (
    <div className="flex h-[calc(100vh-220px)] overflow-x-auto pb-4 gap-4 snap-x snap-mandatory">
      {COLUMNS.map((col) => {
        const colLeads = leads.filter(l => l.status === col.id);
        const totalValue = colLeads.length;

        return (
          <div 
            key={col.id} 
            className={cn(
                "min-w-[280px] w-[300px] shrink-0 flex flex-col rounded-xl border snap-center bg-white/50 backdrop-blur-sm",
                col.borderColor
            )}
          >
            {/* Column Header */}
            <div className={cn("p-3 border-b flex items-center justify-between rounded-t-xl", col.color)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-700">{col.title}</span>
                <Badge variant="secondary" className="bg-white/80 text-slate-600 text-[10px] h-5 px-1.5 shadow-sm">
                    {totalValue}
                </Badge>
              </div>
            </div>

            {/* Column Body */}
            <ScrollArea className="flex-1 p-2 bg-slate-50/30">
                {colLeads.length === 0 ? (
                    <div className="h-24 flex items-center justify-center text-xs text-muted-foreground border-2 border-dashed border-slate-200 rounded-lg m-1">
                        Sin leads
                    </div>
                ) : (
                    <div className="flex flex-col pb-2">
                        {colLeads.map(lead => (
                            <LeadKanbanCard 
                                key={lead.id} 
                                lead={lead} 
                                onClick={() => onLeadClick(lead)} 
                            />
                        ))}
                    </div>
                )}
            </ScrollArea>
          </div>
        );
      })}
    </div>
  );
};