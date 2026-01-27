import React, { useState } from "react";
import { Lead, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
} from "@/components/ui/sheet";
import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue, 
} from "@/components/ui/select";
import { LeadForm } from "./LeadForm";
import { LeadCalls } from "./LeadCalls";
import { Separator } from "@/components/ui/separator";
import { UserCheck, Trash2, Edit, CalendarClock, Phone } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";

interface LeadDetailsProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onConvertToStudent: (lead: Lead) => void;
}

export const LeadDetails = ({ lead, isOpen, onClose, onUpdate, onConvertToStudent }: LeadDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!lead) return null;

  const handleUpdateStatus = async (newStatus: LeadStatus) => {
    try {
        const { error } = await supabase
            .from('leads')
            .update({ status: newStatus })
            .eq('id', lead.id);
        
        if (error) throw error;
        onUpdate();
        showSuccess(`Estado actualizado a ${newStatus}`);
    } catch (error) {
        showError("Error al actualizar estado");
    }
  };

  const handleEdit = async (data: any) => {
      try {
        // We update the basic info. Note: nextCallDate in the form updates the lead field, 
        // but for full consistency we might want to ensure calls are synced.
        // For now, simple update of lead table.
        const { error } = await supabase
            .from('leads')
            .update({
                name: data.name,
                email: data.email,
                phone: data.phone,
                interest_level: data.interestLevel,
                notes: data.notes,
                next_call_date: data.nextCallDate?.toISOString()
            })
            .eq('id', lead.id);

        if (error) throw error;
        onUpdate();
        setIsEditing(false);
        showSuccess("Lead actualizado");
      } catch (error) {
          showError("Error al editar lead");
      }
  };

  const handleDelete = async () => {
      try {
          const { error } = await supabase.from('leads').delete().eq('id', lead.id);
          if (error) throw error;
          onClose();
          onUpdate();
          showSuccess("Lead eliminado");
      } catch (error) {
          showError("Error al eliminar");
      }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-2xl font-bold">{isEditing ? "Editar Lead" : lead.name}</SheetTitle>
          <SheetDescription>
             {isEditing ? "Modifica los datos del prospecto." : "Gestiona el seguimiento de este prospecto."}
          </SheetDescription>
        </SheetHeader>

        {isEditing ? (
            <div className="space-y-4">
                <LeadForm 
                    initialData={lead} 
                    onSubmit={handleEdit} 
                    isLoading={false} 
                />
                <Button variant="outline" className="w-full" onClick={() => setIsEditing(false)}>Cancelar</Button>
            </div>
        ) : (
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Estado del Lead</label>
                    <Select value={lead.status} onValueChange={(val) => handleUpdateStatus(val as LeadStatus)}>
                        <SelectTrigger className={
                            lead.status === 'won' ? 'border-green-500 bg-green-50 text-green-700' : 
                            lead.status === 'lost' ? 'border-red-500 bg-red-50 text-red-700' : 
                            lead.status === 'paused' ? 'border-yellow-500 bg-yellow-50 text-yellow-700' : ''
                        }>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="new">🆕 Nuevo</SelectItem>
                            <SelectItem value="contacted">📞 Contactado</SelectItem>
                            <SelectItem value="qualified">✅ Calificado</SelectItem>
                            <SelectItem value="paused">⏸️ En Pausa</SelectItem>
                            <SelectItem value="won">🎉 Ganado (Cliente)</SelectItem>
                            <SelectItem value="lost">❌ Perdido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                {lead.status === 'won' ? (
                     <div className="p-4 bg-green-50 border border-green-100 rounded-lg text-center space-y-2">
                        <p className="text-green-800 font-medium">¡Lead convertido en Cliente!</p>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onConvertToStudent(lead)}>
                            <UserCheck className="mr-2 h-4 w-4" /> Crear Perfil de Alumno
                        </Button>
                     </div>
                ) : (
                    <Button variant="outline" className="w-full border-green-200 hover:bg-green-50 text-green-700" onClick={() => handleUpdateStatus('won')}>
                         Marcar como Ganado
                    </Button>
                )}

                <Separator />
                
                {/* Contact Info */}
                <div className="space-y-4 text-sm bg-slate-50 p-4 rounded-lg border">
                    {lead.email && (
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground">Email:</span>
                            <span className="col-span-2 select-all">{lead.email}</span>
                        </div>
                    )}
                    {lead.phone && (
                        <div className="grid grid-cols-3 gap-2">
                            <span className="font-medium text-muted-foreground">Teléfono:</span>
                            <span className="col-span-2 select-all">{lead.phone}</span>
                        </div>
                    )}
                     <div className="grid grid-cols-3 gap-2">
                        <span className="font-medium text-muted-foreground">Interés:</span>
                        <span className="col-span-2 capitalize">{lead.interestLevel === 'high' ? '🔥 Alto' : lead.interestLevel === 'medium' ? '🌤️ Medio' : '❄️ Bajo'}</span>
                    </div>
                </div>

                {lead.notes && (
                    <div className="space-y-1">
                        <span className="font-medium text-muted-foreground text-sm">Notas:</span>
                        <div className="p-3 bg-muted rounded-md whitespace-pre-wrap text-sm">
                            {lead.notes}
                        </div>
                    </div>
                )}
                
                <Separator />

                {/* New Calls Component */}
                <LeadCalls lead={lead} onUpdate={onUpdate} />

                <Separator />

                <div className="flex gap-2 pt-2">
                     <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Editar Datos
                     </Button>
                     
                     <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
                        <DialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>¿Eliminar Lead?</DialogTitle>
                                <DialogDescription>
                                    Esta acción no se puede deshacer. Se borrará toda la información de seguimiento.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDeleting(false)}>Cancelar</Button>
                                <Button variant="destructive" onClick={handleDelete}>Eliminar Definitivamente</Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>
                </div>
            </div>
        )}
      </SheetContent>
    </Sheet>
  );
};