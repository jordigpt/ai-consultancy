import React from "react";
import { Lead } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, MoreHorizontal, Phone, Mail, MessageCircle } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface LeadKanbanCardProps {
  lead: Lead;
  onClick: () => void;
}

export const LeadKanbanCard = ({ lead, onClick }: LeadKanbanCardProps) => {
  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group bg-white mb-3 active:scale-95 duration-200"
      onClick={onClick}
    >
      <CardContent className="p-3 space-y-3">
        {/* Header: Name & Interest */}
        <div className="flex justify-between items-start gap-2">
            <h4 className="font-semibold text-sm leading-tight line-clamp-2 text-slate-900">
                {lead.name}
            </h4>
            <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1", 
                lead.interestLevel === 'high' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" : 
                lead.interestLevel === 'medium' ? "bg-orange-400" : "bg-blue-400"
            )} title="Nivel de interés" />
        </div>

        {/* Contact Info Preview */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {lead.email ? <Mail size={12} /> : <Phone size={12} />}
            <span className="truncate max-w-[120px]">
                {lead.email || lead.phone || "Sin contacto"}
            </span>
        </div>

        {/* Footer: Date / Status */}
        <div className="space-y-1.5">
            {/* Scheduled Call */}
            {lead.nextCallDate && lead.status !== 'won' && lead.status !== 'lost' && (
                <div className={cn(
                    "text-[10px] px-2 py-1 rounded flex items-center gap-1.5 font-medium border",
                    isPast(lead.nextCallDate) 
                        ? "bg-red-50 text-red-700 border-red-100" 
                        : "bg-blue-50 text-blue-700 border-blue-100"
                )}>
                    <CalendarClock size={10} />
                    <span className="truncate">
                        Call: {format(lead.nextCallDate, "d MMM, HH:mm")}
                    </span>
                </div>
            )}

            {/* Scheduled Follow Up */}
            {lead.nextFollowupDate && lead.status !== 'won' && lead.status !== 'lost' && (
                <div className={cn(
                    "text-[10px] px-2 py-1 rounded flex items-center gap-1.5 font-medium border",
                    isPast(lead.nextFollowupDate) 
                        ? "bg-red-50 text-red-700 border-red-100" 
                        : "bg-purple-50 text-purple-700 border-purple-100"
                )}>
                    <MessageCircle size={10} />
                    <span className="truncate">
                        Seguimiento: {format(lead.nextFollowupDate, "d MMM")}
                    </span>
                </div>
            )}
        </div>

        {/* Badges for Won/Lost if needed (mostly for filtering visual confirmation) */}
        {lead.status === 'won' && (
             <Badge className="w-full justify-center bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shadow-none text-[10px] h-5">Cliente Ganado</Badge>
        )}
      </CardContent>
    </Card>
  );
};