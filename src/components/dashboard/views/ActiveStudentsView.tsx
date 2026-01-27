import React, { useState } from "react";
import { Student, HealthScore } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search, Filter, Activity } from "lucide-react";
import { MetricsOverview } from "@/components/dashboard/MetricsOverview";
import { StudentList } from "@/components/dashboard/StudentList";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ActiveStudentsViewProps {
  students: Student[];
  onStudentClick: (student: Student) => void;
}

export const ActiveStudentsView = ({ students, onStudentClick }: ActiveStudentsViewProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [healthFilter, setHealthFilter] = useState<"all" | HealthScore>("all");

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.occupation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesHealth = healthFilter === "all" || student.healthScore === healthFilter;
    
    return matchesSearch && matchesHealth;
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                    placeholder="Buscar alumno..." 
                    className="pl-9 bg-white shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={healthFilter} onValueChange={(val) => setHealthFilter(val as any)}>
                <SelectTrigger className="w-[140px] bg-white shadow-sm">
                    <Activity className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="green">🟢 Al día</SelectItem>
                    <SelectItem value="yellow">🟡 Riesgo</SelectItem>
                    <SelectItem value="red">🔴 Crítico</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <MetricsOverview students={students} />
        
        <StudentList 
            students={filteredStudents} 
            searchQuery="" // We already filtered manually
            onStudentClick={onStudentClick} 
        />
    </div>
  );
};