import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { StudentFormValues } from "./schema";

interface ContextDetailsProps {
  control: Control<StudentFormValues>;
}

export const ContextDetails = ({ control }: ContextDetailsProps) => {
  return (
    <FormField
      control={control}
      name="context"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Contexto / Notas Adicionales</FormLabel>
          <FormControl>
            <Textarea 
              placeholder="Notas sobre sus objetivos..."
              className="min-h-[100px]"
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};