import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { 
  Menu, 
  LayoutDashboard, 
  Users, 
  Target, 
  Calendar, 
  ClipboardList, 
  StickyNote, 
  GraduationCap, 
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ item, isCollapsed }: { item: typeof MENU_ITEMS[0], isCollapsed?: boolean }) => {
    const isActive = activeView === item.id;
    
    const ButtonContent = (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-10 mb-1 transition-all duration-200",
          isActive 
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => handleNavigate(item.id)}
      >
        <item.icon size={20} className={cn("shrink-0", isActive ? "text-blue-600" : "text-gray-500")} />
        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
        {isActive && !isCollapsed && <ChevronRight size={14} className="ml-auto opacity-50" />}
      </Button>
    );

    if (isCollapsed) {
        return (
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>{ButtonContent}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                    {item.label}
                </TooltipContent>
            </Tooltip>
        );
    }

    return ButtonContent;
  };

  const MobileNavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
          AI Consultancy
        </h1>
        <p className="text-xs text-muted-foreground">Tracking System</p>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {MENU_ITEMS.map((item) => (
          <NavItem key={item.id} item={item} />
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
    <TooltipProvider>
        <div className="min-h-screen bg-gray-50/50 flex">
        {/* Desktop Sidebar */}
        <aside 
            className={cn(
                "hidden lg:flex flex-col border-r h-screen sticky top-0 z-30 bg-white transition-all duration-300 shadow-sm ease-in-out",
                isCollapsed ? "w-[70px]" : "w-64"
            )}
        >
            <div className={cn("flex items-center h-16 border-b px-4", isCollapsed ? "justify-center" : "justify-between")}>
                {!isCollapsed && (
                    <div className="overflow-hidden whitespace-nowrap">
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                        AI Consultancy
                        </h1>
                    </div>
                )}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                </Button>
            </div>

            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => (
                    <NavItem key={item.id} item={item} isCollapsed={isCollapsed} />
                ))}
            </nav>

            <div className="p-3 mt-auto border-t">
                {isCollapsed ? (
                     <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="w-full h-9 text-red-600 hover:bg-red-50"
                                onClick={onSignOut}
                            >
                                <LogOut size={18} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Cerrar Sesión</TooltipContent>
                     </Tooltip>
                ) : (
                    <Button 
                        variant="ghost" 
                        className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 h-9"
                        onClick={onSignOut}
                    >
                        <LogOut size={18} />
                        <span className="text-sm">Salir</span>
                    </Button>
                )}
            </div>
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
                            <MobileNavContent />
                        </SheetContent>
                    </Sheet>
                    <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
                        AI Consultancy
                    </span>
            </div>
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:block">
                {MENU_ITEMS.find(i => i.id === activeView)?.label}
            </div>
            </header>

            {/* Scrollable Content */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
                    {children}
                </div>
            </main>
        </div>
        </div>
    </TooltipProvider>
  );
};