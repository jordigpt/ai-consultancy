import React from "react";
import { Student } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { User } from "lucide-react";
import { StudentFinances } from "./StudentFinances";
import { StudentInfo } from "./StudentInfo";
import { StudentCalls } from "./StudentCalls";
import { StudentTasks } from "./StudentTasks";

interface StudentDetailsProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStudent: (updatedStudent: Student) => void;
}

export const StudentDetails = ({ student, isOpen, onClose, onUpdateStudent }: StudentDetailsProps) => {
  if (!student) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
                {student.firstName[0]}{student.lastName[0]}
              </div>
              {student.firstName} {student.lastName}
            </SheetTitle>
            {student.paidInFull ? (
              <Badge variant="default" className="bg-green-600 hover:bg-green-700">Pagado</Badge>
            ) : (
              <Badge variant="destructive">Deuda: ${student.amountOwed}</Badge>
            )}
          </div>
          <SheetDescription className="text-base font-medium text-foreground/80">
            {student.occupation}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <StudentFinances student={student} />
          
          <StudentInfo student={student} onUpdate={onUpdateStudent} />

          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <User size={16} /> Contexto
            </h3>
            <div className="p-3 bg-muted rounded-md text-sm text-muted-foreground whitespace-pre-wrap">
              {student.context || "Sin contexto adicional."}
            </div>
          </div>

          <Separator />
          
          <StudentCalls student={student} onUpdate={onUpdateStudent} />

          <Separator />

          <StudentTasks student={student} onUpdate={onUpdateStudent} />
        </div>
      </SheetContent>
    </Sheet>
  );
};