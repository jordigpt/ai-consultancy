import React from "react";
import { Student } from "@/lib/types";
import { DollarSign } from "lucide-react";

interface StudentFinancesProps {
  student: Student;
}

export const StudentFinances = ({ student }: StudentFinancesProps) => {
  if (student.paidInFull) return null;

  return (
    <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-2">
      <h4 className="text-sm font-semibold text-red-800 flex items-center gap-2">
        <DollarSign size={14} /> Estado de Cuenta
      </h4>
      <div className="flex justify-between text-sm">
        <span className="text-red-600">Pagado:</span>
        <span className="font-mono font-medium">${student.amountPaid}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-red-600">Restante:</span>
        <span className="font-mono font-bold text-red-700">${student.amountOwed}</span>
      </div>
    </div>
  );
};