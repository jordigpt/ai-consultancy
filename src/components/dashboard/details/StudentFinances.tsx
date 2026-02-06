import React, { useState } from "react";
import { Student } from "@/lib/types";
import { DollarSign, Plus, AlertTriangle, History, Clock, TrendingUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { showSuccess, showError } from "@/utils/toast";
import { format, addMonths, differenceInMonths, isAfter, startOfDay } from "date-fns";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- NUEVA LÓGICA DE CICLOS (MESES PAGADOS VS CURSADOS) ---
  const startDate = startOfDay(new Date(student.startDate));
  const today = startOfDay(new Date());

  // 1. Pagos válidos (ignoramos montos 0 o negativos si hubiera)
  const validPayments = (student.payments || []).filter(p => p.amount > 0);
  const paymentsCount = validPayments.length;

  // 2. Meses que "deberían" estar pagos a la fecha
  // Si hoy es el mismo día de inicio o después, ya cuenta como mes 1.
  // differenceInMonths(Feb 1, Jan 1) = 1. Si hoy es Feb 1, ya empezó el mes 2 -> Debería tener 2 pagos.
  const monthsElapsed = differenceInMonths(today, startDate);
  
  // Ajuste: Si el día del mes de hoy es >= al día de inicio, sumamos 1 porque ya arrancó el siguiente mes.
  // Ejemplo: Inicio 15 Ene. Hoy 10 Feb. Diff=0. Mes Cursando = 1. (OK)
  // Ejemplo: Inicio 15 Ene. Hoy 15 Feb. Diff=1. Mes Cursando = 2. (OK)
  // Nota: differenceInMonths es a veces estricto, usaremos lógica de fecha.
  
  let currentMonthNumber = monthsElapsed;
  if (today.getDate() >= startDate.getDate()) {
      currentMonthNumber += 1;
  }
  // Edge case: Si es el primer mes (diff 0) y día < start, sigue siendo mes 1 si ya start pasó.
  if (currentMonthNumber < 1) currentMonthNumber = 1;

  // 3. Estado de Deuda
  // Deuda = Meses Cursando - Pagos Realizados
  const monthsOwed = currentMonthNumber - paymentsCount;
  const isOverdue = monthsOwed > 0;

  // 4. Próximo Vencimiento (o Vencimiento Actual si debe)
  // Fecha cubierta = Inicio + (Pagos * 1 mes)
  const coveredUntil = addMonths(startDate, paymentsCount);
  // El próximo pago vence el día que se acaba la cobertura
  const nextDueDate = coveredUntil;

  // 5. Textos
  const statusLabel = isOverdue 
    ? `Debe ${monthsOwed} mes${monthsOwed > 1 ? 'es' : ''}` 
    : `Al día (Cubierto Mes ${paymentsCount})`;

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
            notes: `Pago Mes ${paymentsCount + 1}` // Asumimos que paga el siguiente
        })
        .select()
        .single();

      if (payError) throw payError;

      // 2. Actualizar next_billing_date en DB para sincronizar
      // Nuevo vencimiento = Inicio + (PagosActuales + 1) meses
      const newNextBillingDate = addMonths(startDate, paymentsCount + 1);
      
      await supabase
        .from('students')
        .update({ next_billing_date: newNextBillingDate.toISOString() })
        .eq('id', student.id);

      // 3. Update UI
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

      showSuccess("Pago registrado");
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
    <div className={`p-4 rounded-xl border-2 flex flex-col gap-4 relative overflow-hidden transition-colors ${
        isOverdue ? "bg-red-50/50 border-red-100" : "bg-green-50/50 border-green-100"
    }`}>
      
      {/* Header Info */}
      <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
                <Badge variant={isOverdue ? "destructive" : "outline"} className={`h-6 ${isOverdue ? "bg-red-600 hover:bg-red-700" : "bg-green-100 text-green-700 border-green-200"}`}>
                    {isOverdue ? <AlertTriangle size={12} className="mr-1.5" /> : <CheckCircle2 size={12} className="mr-1.5" />}
                    {isOverdue ? "Pago Pendiente" : "Al día"}
                </Badge>
                <Badge variant="secondary" className="h-6 bg-white text-slate-700 border-slate-200 shadow-sm font-medium">
                    <TrendingUp size={12} className="mr-1.5 text-blue-600" /> 
                    Cursando Mes {currentMonthNumber}
                </Badge>
          </div>
          
          <div>
            <h4 className={`text-base font-bold leading-tight ${isOverdue ? "text-red-900" : "text-green-900"}`}>
                {statusLabel}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-slate-500">
                <Clock size={14} className={isOverdue ? "text-red-500" : "text-green-600"} />
                {isOverdue ? "Venció el: " : "Próximo vencimiento: "} 
                <span className={isOverdue ? "text-red-700 font-bold" : "text-slate-900"}>
                    {format(nextDueDate, "d 'de' MMMM", { locale: es })}
                </span>
            </div>
          </div>
      </div>

      {/* Action Button - Full Width for Mobile/Sidebar */}
      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
        <DialogTrigger asChild>
            <Button 
                className={`w-full font-semibold shadow-sm transition-all active:scale-[0.98] ${
                    isOverdue 
                        ? "bg-red-600 hover:bg-red-700 text-white shadow-red-200" 
                        : "bg-white text-green-700 border border-green-200 hover:bg-green-50 hover:border-green-300"
                }`}
            >
                <Plus size={16} className="mr-2" /> Registrar Pago Mes {paymentsCount + 1}
            </Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Registrar Pago - Mes {paymentsCount + 1}</DialogTitle>
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
                
                <Button className="w-full mt-4" onClick={handleRegisterPayment} disabled={isSubmitting}>
                    {isSubmitting ? "Guardando..." : "Confirmar Pago"}
                </Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* History List */}
      <div className="bg-white/80 rounded-lg p-3 border border-gray-100 shadow-sm">
          <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-dashed pb-2">
              <History size={12} /> Historial ({paymentsCount} pagos)
          </h5>
          {!student.payments || student.payments.length === 0 ? (
              <div className="text-center py-2">
                  <p className="text-xs text-muted-foreground italic">No hay pagos registrados aún.</p>
              </div>
          ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                  {student.payments.slice(0, 5).map((pay, i) => (
                      <div key={pay.id} className="flex justify-between items-center text-xs group">
                          <div className="flex flex-col">
                              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">
                                {format(pay.paymentDate, "d MMM yyyy", { locale: es })}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                {pay.notes || `Pago #${paymentsCount - i}`}
                              </span>
                          </div>
                          <span className="font-mono font-bold text-slate-800 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 group-hover:border-green-200 group-hover:bg-green-50 group-hover:text-green-700 transition-all">
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