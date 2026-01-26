import React, { useState } from "react";
import { Lead } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Search, Plus, LayoutList, KanbanSquare } from "lucide-react";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadKanban } from "@/components/leads/LeadKanban";

interface LeadsViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onAddLead: () => void;
  onUpdate: () => void;
}

export const LeadsView = ({ leads, onLeadClick, onAddLead, onUpdate }: LeadsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 h-full flex flex-col">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
             {/* Search Bar */}
            <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                    placeholder="Buscar lead por nombre o email..." 
                    className="pl-9 bg-white shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Actions: Toggle View & Add Button */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(val) => val && setViewMode(val as "list" | "board")}>
                        <ToggleGroupItem value="list" aria-label="Vista Lista" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-white data-[state=on]:shadow-sm">
                            <LayoutList size={16} />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="board" aria-label="Vista Tablero" size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-white data-[state=on]:shadow-sm">
                            <KanbanSquare size={16} />
                        </ToggleGroupItem>
                    </ToggleGroup>
                </div>

                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={onAddLead}>
                    <Plus size={16} className="mr-2" /> Nuevo Lead
                </Button>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
            {filteredLeads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl bg-slate-50/50">
                    <p>No se encontraron leads.</p>
                    {searchQuery && <Button variant="link" onClick={() => setSearchQuery("")} className="mt-2">Limpiar búsqueda</Button>}
                </div>
            ) : (
                <>
                    {viewMode === "list" ? (
                        <div className="space-y-3 max-w-3xl mx-auto animate-in fade-in duration-300">
                            {filteredLeads.map(lead => (
                                <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
                            ))}
                        </div>
                    ) : (
                        <div className="animate-in fade-in duration-300 h-full">
                            <LeadKanban 
                                leads={filteredLeads} 
                                onLeadClick={onLeadClick} 
                                onUpdate={onUpdate}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    </div>
  );
};