import { Lead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Bell, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";

interface NotificationsSectionProps {
  leads: Lead[];
  onOpenLead: (l: Lead) => void;
}

export const NotificationsSection = ({ leads, onOpenLead }: NotificationsSectionProps) => {
  const stagnantLeads = leads.filter(lead => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt));
    return daysSinceCreation >= 7 && lead.status !== 'won' && lead.status !== 'lost';
  });

  if (stagnantLeads.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-start gap-3">
          <div className="bg-orange-100 p-2 rounded-full text-orange-600 mt-0.5 sm:mt-0">
              <Bell size={18} />
          </div>
          <div>
              <h3 className="font-semibold text-orange-900">Seguimiento Requerido</h3>
              <p className="text-sm text-orange-700">
                  Tienes {stagnantLeads.length} leads sin actualizar hace más de 7 días.
              </p>
          </div>
      </div>
      <Button variant="outline" size="sm" className="bg-white border-orange-200 text-orange-800 hover:bg-orange-100 whitespace-nowrap" onClick={() => onOpenLead(stagnantLeads[0])}>
          Ver Leads <ArrowRight size={14} className="ml-1" />
      </Button>
    </div>
  );
};