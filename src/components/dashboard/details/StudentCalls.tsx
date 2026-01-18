import React, { useState } from "react";
import { Student, Call } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Plus, Trash2, Clock, Pencil, CalendarPlus } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { downloadCallIcs } from "@/utils/calendar";

interface StudentCallsProps {
  student: Student;
  onUpdate: (student: Student) => void;
}

export const StudentCalls = ({ student, onUpdate }: StudentCallsProps) => {
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

      const newCallData = {
        student_id: student.id,
        user_id: user.id,
        date: dateTime.toISOString(),
        completed: false
      };

      const { data, error } = await supabase.from('calls').insert(newCallData).select().single();
      if (error) throw error;

      const newCall: Call = {
        id: data.id,
        date: new Date(data.date),
        completed: data.completed
      };

      const updatedCalls = [...student.calls, newCall].sort((a, b) => b.date.getTime() - a.date.getTime());
      onUpdate({ ...student, calls: updatedCalls });
      
      setNewCallDate(undefined);
      setIsAddDialogOpen(false);
      showSuccess("Llamada agendada");
    } catch (error) {
      console.error(error);
      showError("Error al agendar llamada");
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

      const updatedCalls = student.calls.map(c => 
        c.id === editingCall.id ? { ...c, date: dateTime } : c
      ).sort((a, b) => b.date.getTime() - a.date.getTime());

      onUpdate({ ...student, calls: updatedCalls });
      setEditingCall(null);
      showSuccess("Llamada actualizada");
    } catch (error) {
      console.error(error);
      showError("Error al actualizar llamada");
    }
  };

  const deleteCall = async (callId: string) => {
    try {
      const { error } = await supabase.from('calls').delete().eq('id', callId);
      if (error) throw error;

      const updatedCalls = student.calls.filter(c => c.id !== callId);
      onUpdate({ ...student, calls: updatedCalls });
    } catch (error) {
      showError("Error al eliminar llamada");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
          <Phone size={16} /> Llamadas / Consultoría
        </h3>
        
        {/* Cambiado de Popover a Dialog para mejor UX móvil */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8 text-xs sm:text-sm">
              <Plus size={14} className="mr-1" /> Agendar
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] rounded-xl sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agendar Nueva Llamada</DialogTitle>
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

      <div className="space-y-2">
        {student.calls && student.calls.length > 0 ? (
          student.calls.map(call => (
            <div key={call.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg bg-white shadow-sm gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {format(call.date, "EEEE, d MMMM")}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock size={10} />
                    <span>{format(call.date, "HH:mm")} hs</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 justify-end sm:justify-start border-t sm:border-t-0 pt-2 sm:pt-0 mt-1 sm:mt-0">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground hover:text-green-600 hover:bg-green-50" 
                  onClick={() => downloadCallIcs(call, student)}
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
            No hay llamadas programadas.
          </div>
        )}
      </div>

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