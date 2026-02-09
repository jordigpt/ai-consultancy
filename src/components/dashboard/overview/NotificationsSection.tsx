import React, { useState } from "react";
import { Lead } from "@/lib/types";
import { Bell, ChevronRight, ChevronLeft, User } from "lucide-react";
import { differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NotificationsSectionProps {
  leads: Lead[];
  onOpenLead: (l: Lead) => void;
}

export const NotificationsSection = ({ leads, onOpenLead }: NotificationsSectionProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const stagnantLeads = leads.filter(lead => {
    const daysSinceCreation = differenceInDays(new Date(), new Date(lead.createdAt));
    return daysSinceCreation >= 7 && 
           lead.status !== 'won' && 
           lead.status !== 'lost' && 
           lead.status !== 'remarketing';
  });

  if (stagnantLeads.length === 0) return null;

  // Ensure index is valid if list shrinks
  const safeIndex = currentIndex >= stagnantLeads.length ? 0 : currentIndex;
  const currentLead = stagnantLeads[safeIndex];

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % stagnantLeads.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + stagnantLeads.length) % stagnantLeads.length);
  };

  return (
    <div 
        className={cn(
            "group bg-white border border-orange-200 p-3 rounded-lg shadow-sm",
            "flex flex-col sm:flex-row items-center justify-between gap-3 hover:border-orange-300 transition-all animate-in fade-in slide-in-from-top-2"
        )}
    >
      <div 
        className="flex items-center gap-3 w-full sm:w-auto cursor-pointer"
        onClick={() => onOpenLead(currentLead)}
      >
          <div className="bg-orange-100 p-2 rounded-full text-orange-600 relative shrink-0">
              <Bell size={16} />
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
          </div>
          
          <div className="flex flex-col">
            <div className="text-sm font-medium text-slate-700">
                <span className="font-bold text-orange-700">{stagnantLeads.length}</span> leads requieren seguimiento
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="font-semibold text-slate-900">{safeIndex + 1}/{stagnantLeads.length}:</span> 
                <User size={10} /> {currentLead.name}
            </div>
          </div>
      </div>

      <div className="flex items-center gap-1 w-full sm:w-auto justify-end">
         <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-orange-50 text-muted-foreground hover:text-orange-700"
            onClick={handlePrev}
            disabled={stagnantLeads.length <= 1}
         >
            <ChevronLeft size={16} />
         </Button>
         
         <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 hover:bg-orange-50 text-muted-foreground hover:text-orange-700"
            onClick={handleNext}
            disabled={stagnantLeads.length <= 1}
         >
            <ChevronRight size={16} />
         </Button>
         
         <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

         <Button 
            size="sm" 
            variant="outline"
            className="ml-1 h-8 text-xs border-orange-200 hover:bg-orange-50 text-orange-700 hidden sm:flex"
            onClick={() => onOpenLead(currentLead)}
         >
            Ver Detalle
         </Button>
      </div>
    </div>
  );
};