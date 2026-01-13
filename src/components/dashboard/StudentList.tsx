import { Student } from "@/lib/types";
import { StudentCard } from "./StudentCard";

interface StudentListProps {
  students: Student[];
  searchQuery: string;
  onStudentClick: (student: Student) => void;
  emptyMessage?: string;
}

export const StudentList = ({ 
  students, 
  searchQuery, 
  onStudentClick, 
  emptyMessage = "No se encontraron alumnos." 
}: StudentListProps) => {
  
  const filteredList = students.filter(s => 
    s.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.occupation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredList.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredList.map((student) => (
        <StudentCard 
          key={student.id} 
          student={student} 
          onClick={() => onStudentClick(student)} 
        />
      ))}
    </div>
  );
};