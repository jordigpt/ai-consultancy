import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Plus, Calendar, AlertTriangle, CheckCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, addDays, isPast, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface StudentFinancesProps {
  student: Student;
  onUpdate?: (student: Student) => void;
}

export const StudentFinances = ({ student, onUpdate }: StudentFinancesProps) => {
  const [isAddingPayment, setIsAddingPayment] = useState(false);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [shouldUpdateCycle, setShouldUpdateCycle] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determinar estado de facturación
  // Si no hay fecha de próximo cobro, asumimos hoy
  const billingDate = student.nextBillingDate ? new Date(student.nextBillingDate) : new Date();
  const isOverdue = isPast(billingDate) && !isFuture(billingDate); // Si ya pasó la fecha, está vencido/debe renovar

  const handleRegisterPayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
        showError("Ingresa un monto válido");
        return;
    }

    try {
      setIsSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const numAmount = parseFloat(amount);
      const dateObj = new Date(paymentDate);

      // 1. Insertar Pago
      const { data: paymentData, error: payError } = await supabase
        .from('student_payments')
        .insert({
            student_id: student.id,
            user_id: user.id,
            amount: numAmount,
            payment_date: dateObj.toISOString(),
            notes: shouldUpdateCycle ? "Renovación de ciclo" : "Pago parcial/extra"
        })
        .select()
        .single();

      if (payError) throw payError;

      // 2. Actualizar Ciclo del Alumno (si corresponde)
      let newNextBillingDate = student.nextBillingDate;
      if (shouldUpdateCycle) {
          // Si estaba vencido, reseteamos desde HOY + 30 días.
          // Si estaba al día, sumamos 30 días a su fecha actual.
          const baseDate = isOverdue ? new Date() : (student.nextBillingDate || new Date());
          newNextBillingDate = addDays(baseDate, 30);

          await supabase
            .from('students')
            .update({ next_billing_date: newNextBillingDate.toISOString() })
            .eq('id', student.id);
      }

      // 3. Notificar actualización UI
      if (onUpdate) {
          const newPayment = {
              id: paymentData.id,
              studentId: student.id,
              amount: numAmount,
              paymentDate: dateObj,
              notes: paymentData.notes
          };
          
          onUpdate({
              ...student,
              nextBillingDate: newNextBillingDate,
              payments: [newPayment, ...(student.payments || [])]
          });
      }

      showSuccess("Pago registrado correctamente");
      setIsAddingPayment(false);
      setAmount("");
      
    } catch (error) {
      console.error(error);
      showError("Error al registrar pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border space-y-4 relative transition-colors ${
        isOverdue ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
    }`}>
      
      {/* Header Status */}
      <div className="flex items-start justify-between">
          <div>
            <h4 className={`text-sm font-semibold flex items-center gap-2 ${isOverdue ? "text-red-800" : "text-green-800"}`}>
                <DollarSign size={16} /> 
                {isOverdue ? "Renovación Pendiente" : "Cuota al Día"}
            </h4>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Calendar size={12} />
                Vence: <span className="font-medium">{student.nextBillingDate ? format(student.nextBillingDate, "d MMMM", { locale: es }) : "Hoy"}</span>
            </p>
          </div>

          <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
            <DialogTrigger asChild>
                <Button size="sm" className={isOverdue ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}>
                    <Plus size={14} className="mr-1" /> Registrar Pago
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Nuevo Pago</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Monto ($)</Label>
                        <Input 
                            type="number" 
                            placeholder="0.00" 
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            className="text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Fecha de Pago</Label>
                        <Input 
                            type="date" 
                            value={paymentDate} 
                            onChange={(e) => setPaymentDate(e.target.value)} 
                        />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="update-cycle" 
                            checked={shouldUpdateCycle} 
                            onChange={(e) => setShouldUpdateCycle(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="update-cycle" className="text-sm font-normal cursor-pointer">
                            Renovar ciclo por 30 días
                        </Label>
                    </div>
                    
                    <Button className="w-full mt-4" onClick={handleRegisterPayment} disabled={isSubmitting}>
                        {isSubmitting ? "Guardando..." : "Confirmar Pago"}
                    </Button>
                </div>
            </DialogContent>
          </Dialog>
      </div>

      {/* Payment History Preview */}
      <div className="bg-white/60 rounded-md p-3 border border-gray-200/50">
          <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <History size={12} /> Historial Reciente
          </h5>
          {!student.payments || student.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay pagos registrados aún.</p>
          ) : (
              <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                  {student.payments.slice(0, 5).map(pay => (
                      <div key={pay.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-700">{format(pay.paymentDate, "d MMM yyyy", { locale: es })}</span>
                          <span className="font-bold text-slate-900">${pay.amount}</span>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};