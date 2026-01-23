import { Control, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DollarSign } from "lucide-react";
import { StudentFormValues } from "./StudentFormSchema";

interface FinancialDetailsProps {
  control: Control<StudentFormValues>;
}

const PaymentStatusField = ({ control }: { control: Control<StudentFormValues> }) => (
  <FormField
    control={control}
    name="paidInFull"
    render={({ field }) => (
      <FormItem className="flex flex-row items-center justify-between rounded-lg p-0 space-y-0">
        <div className="space-y-0.5">
          <FormLabel className="text-base flex items-center gap-2">
            <DollarSign size={16} /> Estado del Pago
          </FormLabel>
          <div className="text-xs text-muted-foreground">
            {field.value ? "El alumno abonó el total." : "Queda saldo pendiente."}
          </div>
        </div>
        <FormControl>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{field.value ? "Pagado Total" : "Con Deuda"}</span>
            <Switch
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </div>
        </FormControl>
      </FormItem>
    )}
  />
);

const AmountFields = ({ control, showOwed }: { control: Control<StudentFormValues>, showOwed: boolean }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
    <FormField
      control={control}
      name="amountPaid"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Monto Cobrado ($)</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              placeholder="Ej. 1500" 
              inputMode="decimal"
              {...field} 
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    
    {showOwed && (
      <FormField
        control={control}
        name="amountOwed"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Monto Restante ($)</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                placeholder="Ej. 500" 
                inputMode="decimal"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    )}
  </div>
);

export const FinancialDetails = ({ control }: FinancialDetailsProps) => {
  const paidInFull = useWatch({
    control,
    name: "paidInFull",
  });

  return (
    <div className="rounded-lg border p-4 shadow-sm bg-gray-50/50 space-y-4">
      <PaymentStatusField control={control} />
      <AmountFields control={control} showOwed={!paidInFull} />
    </div>
  );
};