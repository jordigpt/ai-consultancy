import React from "react";
import { Lead } from "@/lib/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarClock, CalendarPlus, Mail, MessageSquare, Phone, Clock, DollarSign } from "lucide-react";
import { format, isPast, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { downloadLeadCallIcs } from "@/utils/calendar";

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
}

export const LeadCard = ({ lead, onClick }: LeadCardProps) => {
  const getInterestColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800 hover:bg-red-200 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 hover:bg-orange-200 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'new': return <Badge variant="outline">Nuevo</Badge>;
          case 'contacted': return <Badge variant="secondary">Contactado</Badge>;
          case 'qualified': return <Badge className="bg-indigo-500 hover:bg-indigo-600">Calificado</Badge>;
          case 'paused': return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">En Pausa</Badge>;
          case 'won': return <Badge className="bg-green-500 hover:bg-green-600">Cerrado</Badge>;
          case 'lost': return <Badge variant="destructive">Perdido</Badge>;
          default: return null;
      }
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      downloadLeadCallIcs(lead);
  };

  // Calculate time ago
  const timeAgo = formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es });

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden"
      onClick={onClick}
    >
      {/* Time Ago Badge - Top Right */}
      <div className="absolute top-0 right-0 bg-gray-100 px-3 py-1 rounded-bl-lg border-b border-l text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
        <Clock size={10} /> Cargado {timeAgo}
      </div>

      <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0 mt-2">
        <div>
            <h3 className="font-semibold leading-none text-lg mb-1">{lead.name}</h3>
            <div className="flex flex-wrap gap-2 mt-2">
                {getStatusBadge(lead.status)}
                <Badge variant="outline" className={cn("border", getInterestColor(lead.interestLevel))}>
                    {lead.interestLevel === 'high' && "🔥 Alta"}
                    {lead.interestLevel === 'medium' && "🌤️ Media"}
                    {lead.interestLevel === 'low' && "❄️ Baja"}
                </Badge>
                {lead.value !== undefined && lead.value > 0 && (
                     <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 flex items-center gap-1">
                        <DollarSign size={10} /> {lead.value}
                     </Badge>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
            {lead.email && (
                <div className="flex items-center gap-2">
                    <Mail size={14} /> <span className="truncate">{lead.email}</span>
                </div>
            )}
            {lead.phone && (
                <div className="flex items-center gap-2">
                    <Phone size={14} /> <span>{lead.phone}</span>
                </div>
            )}
            {lead.notes && (
                 <div className="flex items-start gap-2 mt-1">
                    <MessageSquare size={14} className="mt-0.5 shrink-0" /> 
                    <p className="line-clamp-2 text-xs">{lead.notes}</p>
                </div>
            )}
        </div>
      </CardContent>
      {lead.nextCallDate && lead.status !== 'won' && lead.status !== 'lost' && (
        <CardFooter className="p-4 pt-0">
             <div className={cn(
                 "w-full p-2 rounded-md flex items-center justify-between gap-2 text-xs font-medium",
                 isPast(lead.nextCallDate) ? "bg-red-50 text-red-700 border border-red-100" : "bg-blue-50 text-blue-700 border border-blue-100"
             )}>
                <div className="flex items-center gap-2">
                    <CalendarClock size={14} />
                    <span>{isPast(lead.nextCallDate) ? "Vencida: " : "Próxima: "} {format(lead.nextCallDate, "EEE d, HH:mm")}</span>
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 hover:bg-white/50" 
                    onClick={handleCalendarClick}
                    title="Agregar a Calendario"
                >
                    <CalendarPlus size={14} />
                </Button>
             </div>
        </CardFooter>
      )}
    </Card>
  );
};