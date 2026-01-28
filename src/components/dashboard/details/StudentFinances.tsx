import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Pencil, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";

interface StudentFinancesProps {
  student: Student;
  onUpdate?: (student: Student) => void;
}

export const StudentFinances = ({ student, onUpdate }: StudentFinancesProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [amountPaid, setAmountPaid] = useState(student.amountPaid?.toString() || "0");
  const [amountOwed, setAmountOwed] = useState(student.amountOwed?.toString() || "0");
  const [paidInFull, setPaidInFull] = useState(student.paidInFull);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPaid = student.paidInFull || (student.amountOwed || 0) <= 0;

  React.useEffect(() => {
    setAmountPaid(student.amountPaid?.toString() || "0");
    setAmountOwed(student.amountOwed?.toString() || "0");
    setPaidInFull(student.paidInFull);
  }, [student]);

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      const paid = parseFloat(amountPaid) || 0;
      let owed = parseFloat(amountOwed) || 0;
      let finalPaidInFull = paidInFull;

      if (owed <= 0) {
          finalPaidInFull = true;
          owed = 0;
      }

      if (finalPaidInFull) {
          owed = 0;
      }

      const { error } = await supabase
        .from('students')
        .update({
          amount_paid: paid,
          amount_owed: owed,
          paid_in_full: finalPaidInFull
        })
        .eq('id', student.id);

      if (error) throw error;

      if (onUpdate) {
        onUpdate({
          ...student,
          amountPaid: paid,
          amountOwed: owed,
          paidInFull: finalPaidInFull
        });
      }

      showSuccess("Finanzas actualizadas");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      showError("Error al actualizar finanzas");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setAmountPaid(student.amountPaid?.toString() || "0");
    setAmountOwed(student.amountOwed?.toString() || "0");
    setPaidInFull(student.paidInFull);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-4 animate-in fade-in duration-200">
        <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
                <DollarSign size={14} /> Editar Finanzas
            </h4>
        </div>
        
        <div className="space-y-3">
             <div className="flex items-center justify-between border-b pb-2">
                <Label htmlFor="paid-full-switch" className="text-xs">¿Pagado Totalmente?</Label>
                <Switch 
                    id="paid-full-switch" 
                    checked={paidInFull} 
                    onCheckedChange={(checked) => {
                        setPaidInFull(checked);
                        if(checked) setAmountOwed("0");
                    }} 
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Pagado</Label>
                    <Input 
                        type="number" 
                        value={amountPaid} 
                        onChange={(e) => setAmountPaid(e.target.value)} 
                        className="h-8 bg-white"
                    />
                </div>
                <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Deuda</Label>
                    <Input 
                        type="number" 
                        value={amountOwed} 
                        onChange={(e) => setAmountOwed(e.target.value)} 
                        disabled={paidInFull}
                        className="h-8 bg-white disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <Button size="sm" className="w-full" onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
                </Button>
                <Button size="sm" variant="outline" className="w-full" onClick={cancelEdit} disabled={isSubmitting}>
                    Cancelar
                </Button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg border space-y-2 relative group transition-colors ${
        isPaid 
            ? "bg-green-50 border-green-100" 
            : "bg-red-50 border-red-100"
    }`}>
        <Button 
            size="icon" 
            variant="ghost" 
            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white"
            onClick={() => setIsEditing(true)}
        >
            <Pencil size={12} />
        </Button>

      <h4 className={`text-sm font-semibold flex items-center gap-2 ${
          isPaid ? "text-green-800" : "text-red-800"
      }`}>
        <DollarSign size={14} /> Estado de Cuenta
      </h4>
      
      <div className="flex justify-between text-sm items-center">
        <span className={isPaid ? "text-green-700" : "text-red-700"}>Pagado:</span>
        <span className="font-mono font-medium text-base">${student.amountPaid}</span>
      </div>
      
      {!isPaid && (
        <div className="flex justify-between text-sm items-center border-t border-red-200/50 pt-1 mt-1">
            <span className="text-red-600 font-medium">Restante:</span>
            <span className="font-mono font-bold text-red-700 text-base">${student.amountOwed}</span>
        </div>
      )}

      {isPaid && (
          <div className="text-xs text-green-600 font-medium flex items-center gap-1 mt-1">
              <Check size={12} /> Cuenta al día
          </div>
      )}
    </div>
  );
};