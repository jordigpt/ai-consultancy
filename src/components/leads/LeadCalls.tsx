import React, { useState } from "react";
import { Lead, Call } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Plus, Trash2, Clock, Pencil, CalendarPlus, CheckCircle2, Circle } from "lucide-react";
import { format, isFuture } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { downloadLeadCallIcs } from "@/utils/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeadCallsProps {
  lead: Lead;
  onUpdate: () => void;
}

export const LeadCalls = ({ lead, onUpdate }: LeadCallsProps) => {
  // Add Call State
  const [newCallDate, setNewCallDate] = useState<Date | undefined>(undefined);
  const [newCallTime, setNewCallTime] = useState("10:00");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Edit Call State
  const [editingCall, setEditingCall] = useState<Call | null>(null);
  const [editCallDate, setEditCallDate] = useState<Date | undefined>(undefined);
  const [editCallTime, setEditCallTime] = useState("");

  const handleScheduleCall = async () => {
    if (!newCallDate || !newCallTime) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [hours, minutes] = newCallTime.split(':').map(Number);
      const dateTime = new Date(newCallDate);
      dateTime.setHours(hours);
      dateTime.setMinutes(minutes);

      // 1. Insert call into calls table
      const newCallData = {
        lead_id: lead.id,
        user_id: user.id,
        date: dateTime.toISOString(),
        completed: false
      };

      const { error: insertError } = await supabase.from('calls').insert(newCallData);
      if (insertError) throw insertError;

      if (isFuture(dateTime)) {
         const { error: updateError } = await supabase
            .from('leads')
            .update({ next_call_date: dateTime.toISOString() })
            .eq('id', lead.id);
         if (updateError) console.error("Could not update lead next_call_date", updateError);
      }
      
      setNewCallDate(undefined);
      setIsAddDialogOpen(false);
      showSuccess("Llamada agendada");
      onUpdate();
    } catch (error) {
      console.error(error);
      showError("Error al agendar llamada");
    }
  };

  const toggleCallAttendance = async (call: Call) => {
    try {
      const newStatus = !call.completed;
      
      const { error } = await supabase
        .from('calls')
        .update({ completed: newStatus })
        .eq('id', call.id);

      if (error) throw error;

      showSuccess(newStatus ? "Marcado como asistió" : "Marcado como pendiente");
      onUpdate();
    } catch (error) {
      console.error(error);
      showError("Error al actualizar estado");
    }
  };

  const startEditingCall = (call: Call) => {
    setEditingCall(call);
    setEditCallDate(call.date);
    setEditCallTime(format(call.date, "HH:mm"));
  };

  const saveEditedCall = async () => {
    if (!editingCall || !editCallDate || !editCallTime) return;

    try {
      const [hours, minutes] = editCallTime.split(':').map(Number);
      const dateTime = new Date(editCallDate);
      dateTime.setHours(hours);
      dateTime.setMinutes(minutes);

      const { error } = await supabase
        .from('calls')
        .update({ date: dateTime.toISOString() })
        .eq('id', editingCall.id);

      if (error) throw error;

       if (isFuture(dateTime)) {
            await supabase
            .from('leads')
            .update({ next_call_date: dateTime.toISOString() })
            .eq('id', lead.id);
       }

      setEditingCall(null);
      showSuccess("Llamada actualizada");
      onUpdate();
    } catch (error) {
      console.error(error);
      showError("Error al actualizar llamada");
    }
  };

  const deleteCall = async (callId: string) => {
    try {
      const { error } = await supabase.from('calls').delete().eq('id', callId);
      if (error) throw error;

      showSuccess("Llamada eliminada");
      onUpdate();
    } catch (error) {
      showError("Error al eliminar llamada");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Phone size={16} /> Historial de Llamadas
        </h3>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs sm:text-sm">
              <Plus size={14} className="mr-1" /> Agendar
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] rounded-xl sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Llamada con Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <div className="flex justify-center border rounded-md p-2 bg-gray-50/50">
                  <Calendar
                    mode="single"
                    selected={newCallDate}
                    onSelect={setNewCallDate}
                    initialFocus
                    className="rounded-md shadow-sm bg-white"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input 
                  type="time" 
                  value={newCallTime} 
                  onChange={(e) => setNewCallTime(e.target.value)}
                  className="text-lg h-12"
                />
              </div>
              <Button 
                className="w-full h-11 text-base mt-2" 
                onClick={handleScheduleCall} 
                disabled={!newCallDate}
              >
                Confirmar Agendamiento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <TooltipProvider>
      <div className="space-y-2">
        {lead.calls && lead.calls.length > 0 ? (
          lead.calls.map(call => (
            <div 
              key={call.id} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg shadow-sm gap-3 transition-colors ${
                call.completed ? "bg-green-50/50 border-green-100" : "bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => toggleCallAttendance(call)}
                      className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 ${
                        call.completed 
                          ? "bg-green-100 text-green-600 hover:bg-green-200" 
                          : "bg-orange-100 text-orange-600 hover:bg-orange-200"
                      }`}
                    >
                      {call.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{call.completed ? "Marcar como pendiente" : "Marcar que asistió"}</p>
                  </TooltipContent>
                </Tooltip>

                <div>
                  <p className={`text-sm font-medium ${call.completed ? "text-green-800 line-through opacity-70" : ""}`}>
                    {format(call.date, "EEEE, d MMMM")}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{format(call.date, "HH:mm")} hs</span>
                    </div>
                    {call.completed && (
                      <span className="text-green-600 font-medium bg-green-100 px-1.5 rounded text-[10px]">
                        Asistió
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50" 
                  onClick={() => downloadLeadCallIcs(lead)}
                  title="Agregar a Calendario"
                >
                  <CalendarPlus size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-blue-500" onClick={() => startEditingCall(call)}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={() => deleteCall(call.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
            No hay llamadas registradas.
            {lead.nextCallDate && (
                <div className="mt-2 text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
                    Nota: Hay una "Próxima Llamada" ({format(lead.nextCallDate, "d MMM")}) pero no está en el nuevo historial.
                </div>
            )}
          </div>
        )}
      </div>
      </TooltipProvider>

      <Dialog open={!!editingCall} onOpenChange={(open) => !open && setEditingCall(null)}>
        <DialogContent className="w-[95vw] rounded-xl sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Llamada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <div className="flex justify-center border rounded-md p-2">
                <Calendar
                  mode="single"
                  selected={editCallDate}
                  onSelect={setEditCallDate}
                  initialFocus
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Hora</Label>
              <Input 
                type="time" 
                value={editCallTime} 
                onChange={(e) => setEditCallTime(e.target.value)}
                className="text-lg"
              />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={() => setEditingCall(null)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={saveEditedCall} className="w-full sm:w-auto">Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};