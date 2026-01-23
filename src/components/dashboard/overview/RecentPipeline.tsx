import { Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface RecentPipelineProps {
  leads: Lead[];
  onOpenLead: (l: Lead) => void;
  onAddLead: () => void;
}

export const RecentPipeline = ({ leads, onOpenLead, onAddLead }: RecentPipelineProps) => {
  return (
    <Card className="flex flex-col h-full">
        <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Reciente</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-3 flex-1">
            {leads.slice(0, 3).map(lead => (
                <div key={lead.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors" onClick={() => onOpenLead(lead)}>
                    <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${lead.interestLevel === 'high' ? 'bg-red-500' : lead.interestLevel === 'medium' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                        <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{lead.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock size={10} /> {formatDistanceToNow(new Date(lead.createdAt), { addSuffix: true, locale: es })}
                            </p>
                        </div>
                    </div>
                    <ChevronRight size={14} className="text-muted-foreground/50" />
                </div>
            ))}
                <Button variant="ghost" size="sm" className="w-full text-xs mt-auto" onClick={onAddLead}>Ver pipeline completo</Button>
        </CardContent>
    </Card>
  );
};