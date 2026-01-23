import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Target, 
  Calendar, 
  ClipboardList, 
  StickyNote, 
  GraduationCap, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Panel General', icon: LayoutDashboard },
  { id: 'active', label: 'Alumnos Activos', icon: Users },
  { id: 'leads', label: 'Pipeline Leads', icon: Target },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'tasks', label: 'Mis Tareas', icon: ClipboardList },
  { id: 'notes', label: 'Note Bank', icon: StickyNote },
  { id: 'graduated', label: 'Egresados', icon: GraduationCap },
];

export const AppLayout = ({ children, activeView, onNavigate, onSignOut }: AppLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-8">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
          AI Consultancy
        </h1>
        <p className="text-xs text-muted-foreground">Tracking System</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {MENU_ITEMS.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 h-11 text-base font-medium transition-all",
              activeView === item.id 
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" 
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
            onClick={() => handleNavigate(item.id)}
          >
            <item.icon size={20} className={activeView === item.id ? "text-blue-600" : "text-gray-500"} />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <Button 
            variant="outline" 
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-100"
            onClick={onSignOut}
        >
            <LogOut size={20} />
            Cerrar Sesión
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r h-screen sticky top-0 z-30 shadow-sm">
        <NavContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden bg-white/80 backdrop-blur-md border-b p-4 flex items-center justify-between sticky top-0 z-40">
           <div className="flex items-center gap-2">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="-ml-2">
                            <Menu size={24} />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[280px]">
                        <NavContent />
                    </SheetContent>
                </Sheet>
                <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                    AI Consultancy
                </span>
           </div>
           {/* Current View Label for Mobile */}
           <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">
              {MENU_ITEMS.find(i => i.id === activeView)?.label}
           </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </div>
    </div>
  );
};