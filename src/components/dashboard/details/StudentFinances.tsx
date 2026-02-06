import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Plus, Calendar, AlertTriangle, History, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, addDays, isPast, isFuture, differenceInMonths, isSameDay } from "date-fns";
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

  // --- LÓGICA DE CICLOS Y VENCIMIENTOS ---
  const startDate = new Date(student.startDate);
  const today = new Date();

  // 1. Calcular en qué mes de cursada está (Mes 1, Mes 2, etc.)
  // Si inició hoy, es diferencia 0, por eso sumamos 1.
  const monthsSinceStart = differenceInMonths(today, startDate);
  const currentMonthNumber = monthsSinceStart + 1;

  // 2. Obtener el último pago válido
  // Ordenamos los pagos por fecha descendente
  const sortedPayments = [...(student.payments || [])].sort((a, b) => b.paymentDate.getTime() - a.paymentDate.getTime());
  const lastPayment = sortedPayments.length > 0 ? sortedPayments[0] : null;

  // 3. Calcular vencimiento real
  // Si hay pagos: Vence 30 días después del último pago.
  // Si NO hay pagos: Vence 30 días después de la fecha de inicio.
  let realDueDate: Date;
  if (lastPayment) {
      realDueDate = addDays(lastPayment.paymentDate, 30);
  } else {
      realDueDate = addDays(startDate, 30);
  }

  // 4. Determinar si está vencido
  // Está vencido si la fecha límite (realDueDate) ya pasó y no es hoy.
  // Nota: isPast devuelve true si es ayer o antes.
  const isOverdue = isPast(realDueDate) && !isSameDay(realDueDate, today);

  // 5. Estado visual
  const statusLabel = isOverdue 
    ? `Deuda Pendiente (Mes ${currentMonthNumber})` 
    : `Al día (Cubierto hasta Mes ${currentMonthNumber})`;

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
            notes: shouldUpdateCycle ? `Pago Mes ${currentMonthNumber}` : "Pago parcial/extra"
        })
        .select()
        .single();

      if (payError) throw payError;

      // 2. Actualizar Ciclo del Alumno (si corresponde)
      // Si actualizamos ciclo, seteamos el next_billing_date en la DB para que coincida con nuestro cálculo lógico
      let newNextBillingDate = student.nextBillingDate;
      if (shouldUpdateCycle) {
          const calculatedNextDue = addDays(dateObj, 30);
          newNextBillingDate = calculatedNextDue;

          await supabase
            .from('students')
            .update({ next_billing_date: calculatedNextDue.toISOString() })
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
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
                 <Badge variant={isOverdue ? "destructive" : "default"} className={isOverdue ? "bg-red-600" : "bg-green-600"}>
                    {isOverdue ? <AlertTriangle size={10} className="mr-1" /> : <DollarSign size={10} className="mr-1" />}
                    {isOverdue ? "Pago Requerido" : "Estado Activo"}
                 </Badge>
                 <Badge variant="outline" className="bg-white/50 text-slate-700 border-slate-300">
                    <TrendingUp size={10} className="mr-1" /> Cursando Mes {currentMonthNumber}
                 </Badge>
            </div>
            
            <h4 className={`text-sm font-bold flex items-center gap-2 ${isOverdue ? "text-red-900" : "text-green-900"}`}>
                {statusLabel}
            </h4>
            
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Clock size={12} />
                {isOverdue ? "Venció el: " : "Próximo vencimiento: "} 
                <span className="font-bold">
                    {format(realDueDate, "d 'de' MMMM", { locale: es })}
                </span>
            </p>
          </div>

          <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
            <DialogTrigger asChild>
                <Button size="sm" className={isOverdue ? "bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto" : "bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"}>
                    <Plus size={14} className="mr-1" /> Registrar Pago
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Pago - Mes {currentMonthNumber}</DialogTitle>
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
                    <div className="flex items-center gap-2 pt-2 bg-slate-50 p-2 rounded border">
                        <input 
                            type="checkbox" 
                            id="update-cycle" 
                            checked={shouldUpdateCycle} 
                            onChange={(e) => setShouldUpdateCycle(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="update-cycle" className="text-sm font-medium cursor-pointer">
                            Extender vencimiento 30 días
                            <span className="block text-[10px] text-muted-foreground font-normal">
                                (Recomendado para pagos mensuales completos)
                            </span>
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
              <History size={12} /> Historial de Pagos
          </h5>
          {!student.payments || student.payments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No hay pagos registrados aún.</p>
          ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {student.payments.slice(0, 5).map(pay => (
                      <div key={pay.id} className="flex justify-between items-center text-xs border-b border-dashed pb-1 last:border-0 last:pb-0">
                          <div className="flex flex-col">
                              <span className="text-slate-700 font-medium">{format(pay.paymentDate, "d MMM yyyy", { locale: es })}</span>
                              {pay.notes && <span className="text-[10px] text-muted-foreground">{pay.notes}</span>}
                          </div>
                          <span className="font-bold text-slate-900 bg-green-50 px-1.5 py-0.5 rounded text-green-700 border border-green-100">
                            ${pay.amount}
                          </span>
                      </div>
                  ))}
              </div>
          )}
      </div>
    </div>
  );
};