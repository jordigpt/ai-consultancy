import React, { useState } from "react";
import { Student } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { StudentList } from "@/components/dashboard/StudentList";

interface GraduatedStudentsViewProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
}

export const GraduatedStudentsView = ({ students, onStudentClick }: GraduatedStudentsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
        <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
                placeholder="Buscar egresado..." 
                className="pl-9 bg-white shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        <StudentList 
            students={students} 
            searchQuery={searchQuery} 
            onStudentClick={onStudentClick} 
            emptyMessage="No hay alumnos egresados aún."
        />
    </div>
  );
};