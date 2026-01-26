import { Lead } from "@/lib/types";
import { Bell, ChevronRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";

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
    <div 
        onClick={() => onOpenLead(stagnantLeads[0])}
        className={cn(
            "group cursor-pointer bg-white border border-orange-200 p-2.5 rounded-lg shadow-sm",
            "flex items-center justify-between gap-3 hover:bg-orange-50/50 hover:border-orange-300 transition-all animate-in fade-in slide-in-from-top-2"
        )}
    >
      <div className="flex items-center gap-2.5">
          <div className="bg-orange-100 p-1.5 rounded-full text-orange-600 relative">
              <Bell size={14} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
          </div>
          <div className="text-sm font-medium text-slate-700 group-hover:text-orange-800">
              <span className="font-bold">{stagnantLeads.length}</span> leads requieren seguimiento
          </div>
      </div>
      <ChevronRight size={16} className="text-muted-foreground group-hover:text-orange-500 transition-colors" />
    </div>
  );
};