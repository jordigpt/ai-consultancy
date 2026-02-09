import React from "react";
import { Lead } from "@/lib/types";
import { Bell, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { differenceInDays, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface NotificationsViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

export const NotificationsView = ({ leads, onLeadClick }: NotificationsViewProps) => {
  // Filtramos leads que:
  // 1. Tengan más de 7 días de creados
  // 2. No estén ganados, perdidos, ni en remarketing
  const stagnantLeads = leads.filter(lead => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt));
    return daysSinceCreation >= 7 && 
           lead.status !== 'won' && 
           lead.status !== 'lost' && 
           lead.status !== 'remarketing';
  });

  if (stagnantLeads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="h-20 w-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={40} />
        </div>
        <div>
            <h3 className="text-lg font-semibold">¡Todo al día!</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">
                No tienes leads activos (sin remarketing) pendientes de seguimiento con más de 7 días.
            </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3">
        <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-0.5">
            <Bell size={18} />
        </div>
        <div>
            <h3 className="font-semibold text-orange-900">Seguimiento Requerido</h3>
            <p className="text-sm text-orange-700">
                Tienes {stagnantLeads.length} leads cargados hace más de 7 días que aún no se han cerrado ni movido a remarketing.
            </p>
        </div>
      </div>

      <div className="grid gap-3">
        {stagnantLeads.map((lead) => (
          <Card 
            key={lead.id} 
            className="p-4 flex items-center justify-between hover:border-primary/50 cursor-pointer transition-all"
            onClick={() => onLeadClick(lead)}
          >
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{lead.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border capitalize">
                        {lead.status === 'new' ? 'Nuevo' : lead.status === 'contacted' ? 'Contactado' : lead.status}
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock size={12} />
                    <span>
                        Cargado {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                    </span>
                </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
                <ArrowRight size={18} />
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
};