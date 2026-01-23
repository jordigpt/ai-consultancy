import React, { useState } from "react";
import { Student, Lead, MentorTask } from "@/lib/types";
import { NotificationsSection } from "./overview/NotificationsSection";
import { StatsCards } from "./overview/StatsCards";
import { UpcomingCalls } from "./overview/UpcomingCalls";
import { TasksList } from "./overview/TasksList";
import { RecentPipeline } from "./overview/RecentPipeline";
import { OverviewSidebar } from "./overview/OverviewSidebar";
import { AddNoteDialog } from "@/components/notes/AddNoteDialog";

interface OverviewProps {
  students: Student[];
  leads: Lead[];
  mentorTasks: MentorTask[];
  monthlyGoal: number;
  onAddStudent: () => void;
  onAddLead: () => void;
  onAddTask: () => void;
  onOpenStudent: (s: Student) => void;
  onOpenLead: (l: Lead) => void;
  onToggleTask: (task: MentorTask) => void;
}

export const Overview = ({ 
  students, 
  leads, 
  mentorTasks,
  monthlyGoal,
  onAddStudent, 
  onAddLead,
  onAddTask,
  onOpenStudent,
  onOpenLead,
  onToggleTask
}: OverviewProps) => {
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);

  return (
    <div className="space-y-6">
      <NotificationsSection leads={leads} onOpenLead={onOpenLead} />

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* --- LEFT COLUMN (MAIN) --- */}
        <div className="flex-1 space-y-6 min-w-0">
            
            <StatsCards students={students} leads={leads} />

            <UpcomingCalls 
                students={students} 
                leads={leads} 
                onOpenStudent={onOpenStudent} 
                onOpenLead={onOpenLead} 
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <TasksList 
                    mentorTasks={mentorTasks} 
                    onAddTask={onAddTask} 
                    onToggleTask={onToggleTask} 
                 />
                 
                 <RecentPipeline 
                    leads={leads} 
                    onOpenLead={onOpenLead} 
                    onAddLead={onAddLead} 
                 />
            </div>

        </div>

        {/* --- RIGHT COLUMN (WIDGETS) --- */}
        <OverviewSidebar 
            students={students}
            monthlyGoal={monthlyGoal}
            onAddStudent={onAddStudent}
            onAddLead={onAddLead}
            onAddTask={onAddTask}
            onAddNote={() => setIsAddNoteOpen(true)}
        />

      </div>

      <AddNoteDialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen} />
    </div>
  );
};