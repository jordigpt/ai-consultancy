import { Control, useWatch } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { DollarSign } from "lucide-react";
import { StudentFormValues } from "./StudentFormSchema";

interface FinancialDetailsProps {
  control: Control<StudentFormValues>;
}

export const FinancialDetails = ({ control }: FinancialDetailsProps) => {
  const paidInFull = useWatch({
    control,
    name: "paidInFull",
  });

  return (
    <div className="rounded-lg border p-4 shadow-sm bg-gray-50/50 space-y-4">
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
                {field.value ? "Pagado totalmente." : "Pago pendiente."}
              </div>
            </div>
            <FormControl>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{field.value ? "Pagado" : "Deuda"}</span>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </div>
            </FormControl>
          </FormItem>
        )}
      />

      {!paidInFull && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
          <FormField
            control={control}
            name="amountPaid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Pagado ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    inputMode="decimal"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="amountOwed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto Restante ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="0.00" 
                    inputMode="decimal"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
};