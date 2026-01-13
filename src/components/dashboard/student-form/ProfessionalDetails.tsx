import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentFormValues } from "./schema";
import { BusinessModel } from "@/lib/types";

interface ProfessionalDetailsProps {
  control: Control<StudentFormValues>;
}

const businessModels: BusinessModel[] = [
  "Agencia de Automatización (AAA)",
  "SaaS Wrapper",
  "Creación de Contenido AI",
  "Consultoría Estratégica",
  "Desarrollo de Chatbots",
  "VibeCoding de apps",
  "Otro"
];

export const ProfessionalDetails = ({ control }: ProfessionalDetailsProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="occupation"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Ocupación / Rol Actual</FormLabel>
            <FormControl>
              <Input placeholder="Ej. Marketing Manager, Estudiante..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="businessModel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Modelo de Negocio Elegido</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar modelo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {businessModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};