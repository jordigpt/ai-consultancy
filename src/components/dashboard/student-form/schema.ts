import { z } from "zod";

export const studentFormSchema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido").or(z.literal("")),
  occupation: z.string().min(2, "La ocupación es requerida"),
  businessModel: z.string().min(1, "Selecciona un modelo de negocio"),
  aiLevel: z.array(z.number()).min(1),
  startDate: z.date({
    required_error: "La fecha de inicio es requerida",
  }),
  paidInFull: z.boolean().default(true),
  amountPaid: z.string().optional(),
  amountOwed: z.string().optional(),
  context: z.string().optional(),
});

export type StudentFormValues = z.infer<typeof studentFormSchema>;