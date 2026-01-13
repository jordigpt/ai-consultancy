import { Control } from "react-hook-form";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StudentFormValues } from "./StudentFormSchema";

interface ProgramDetailsProps {
  control: Control<StudentFormValues>;
}

export const ProgramDetails = ({ control }: ProgramDetailsProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="aiLevel"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel actual de IA (1-10)</FormLabel>
            <FormControl>
              <div className="flex items-center gap-4 bg-secondary/20 p-3 rounded-lg">
                <Slider
                  min={1}
                  max={10}
                  step={1}
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex-1 touch-none"
                />
                <span className="font-bold text-lg w-8 text-center">{field.value?.[0]}</span>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="startDate"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Fecha de Inicio</FormLabel>
            <Popover>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {field.value ? format(field.value, "PPP") : <span>Seleccionar fecha</span>}
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};