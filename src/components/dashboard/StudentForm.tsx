import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Loader2 } from "lucide-react";
import { Student } from "@/lib/types";
import { studentFormSchema, StudentFormValues } from "./StudentFormSchema";
import { PersonalDetails } from "./StudentFormPersonalDetails";
import { ProfessionalDetails } from "./StudentFormProfessionalDetails";
import { ProgramDetails } from "./StudentFormProgramDetails";
import { FinancialDetails } from "./StudentFormFinancialDetails";
import { ContextDetails } from "./StudentFormContextDetails";

interface StudentFormProps {
  onSubmit: (data: Omit<Student, "id" | "tasks" | "calls" | "status" | "notes" | "events">) => void;
  isLoading?: boolean;
}

export const StudentForm = ({ onSubmit, isLoading }: StudentFormProps) => {
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      occupation: "",
      context: "",
      aiLevel: [1],
      businessModel: "Agencia de Automatización (AAA)",
      startDate: new Date(),
      paidInFull: true,
      amountPaid: "",
      amountOwed: "",
    },
  });

  const handleSubmit = (values: StudentFormValues) => {
    // Si está pagado total, amountOwed es 0, pero amountPaid es lo que ingresó el usuario
    onSubmit({
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      occupation: values.occupation,
      context: values.context || "",
      aiLevel: values.aiLevel[0] as any,
      businessModel: values.businessModel as any,
      startDate: values.startDate,
      paidInFull: values.paidInFull,
      amountPaid: Number(values.amountPaid) || 0,
      amountOwed: values.paidInFull ? 0 : Number(values.amountOwed),
      healthScore: "green", // Default to green
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 py-4">
        <PersonalDetails control={form.control} />
        <ProfessionalDetails control={form.control} />
        <ProgramDetails control={form.control} />
        <FinancialDetails control={form.control} />
        <ContextDetails control={form.control} />

        <Button type="submit" className="w-full h-12 text-lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Registrar Alumno
        </Button>
      </form>
    </Form>
  );
};