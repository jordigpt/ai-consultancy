import React, { useState } from "react";
import { Lead } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { LeadCard } from "@/components/leads/LeadCard";

interface LeadsViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onAddLead: () => void;
}

export const LeadsView = ({ leads, onLeadClick, onAddLead }: LeadsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeads = leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                    placeholder="Buscar lead..." 
                    className="pl-9 bg-white shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Button size="icon" className="shrink-0 bg-blue-600 hover:bg-blue-700" onClick={onAddLead}>
                <Plus size={20} />
            </Button>
        </div>

        {filteredLeads.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
                No hay leads registrados aún.
            </div>
        ) : (
            <div className="space-y-3">
                {filteredLeads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => onLeadClick(lead)} />
                ))}
            </div>
        )}
    </div>
  );
};