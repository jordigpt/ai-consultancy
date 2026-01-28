import { Student } from "@/lib/types";

interface MetricsOverviewProps {
  students: Student[];
}

export const MetricsOverview = ({ students }: MetricsOverviewProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-primary">{students.length}</span>
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Cursando</span>
      </div>
      <div className="bg-white p-4 rounded-xl border shadow-sm flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-green-600">
          {students.filter(s => s.paidInFull || (s.amountOwed !== undefined && s.amountOwed <= 0)).length}
        </span>
        <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Pagados</span>
      </div>
    </div>
  );
};