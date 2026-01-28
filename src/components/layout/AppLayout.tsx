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
  ChevronRight,
  PieChart,
  Search,
  Bot
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: React.ReactNode;
  activeView: string;
  onNavigate: (view: string) => void;
  onSignOut: () => void;
  onOpenCommandCenter?: () => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Panel General', icon: LayoutDashboard },
  { id: 'ai-consultant', label: 'Consultor AI', icon: Bot, isSpecial: true },
  { id: 'active', label: 'Alumnos Activos', icon: Users },
  { id: 'leads', label: 'Pipeline Leads', icon: Target },
  { id: 'goals', label: 'Objetivos / Config', icon: PieChart },
  { id: 'calendar', label: 'Agenda', icon: Calendar },
  { id: 'tasks', label: 'Mis Tareas', icon: ClipboardList },
  { id: 'notes', label: 'Note Bank', icon: StickyNote },
  { id: 'graduated', label: 'Egresados', icon: GraduationCap },
];

export const AppLayout = ({ children, activeView, onNavigate, onSignOut, onOpenCommandCenter }: AppLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const NavItem = ({ item, isCollapsed }: { item: typeof MENU_ITEMS[0], isCollapsed?: boolean }) => {
    const isActive = activeView === item.id;
    
    // @ts-ignore
    const isSpecial = item.isSpecial;

    const ButtonContent = (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-10 mb-1 transition-all duration-200",
          isActive 
            ? "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          isSpecial && !isActive && "text-violet-600 hover:bg-violet-50 hover:text-violet-700",
          isSpecial && isActive && "bg-violet-100 text-violet-700 hover:bg-violet-200",
          isCollapsed && "justify-center px-2"
        )}
        onClick={() => handleNavigate(item.id)}
      >
        <item.icon size={20} className={cn(
            "shrink-0", 
            isActive ? (isSpecial ? "text-violet-700" : "text-blue-600") : (isSpecial ? "text-violet-600" : "text-gray-500")
        )} />
        {!isCollapsed && <span className={cn("text-sm font-medium", isSpecial && "font-bold")}>{item.label}</span>}
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

  // Rest of the component is largely the same, just rendering MENU_ITEMS
  const MobileNavContent = () => (
    <div className="flex flex-col h-full py-4">
      <div className="px-6 mb-6">
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-violet-600">
          AI Consultancy
        </h1>
        <p className="text-xs text-muted-foreground">Tracking System</p>
      </div>
      
      <div className="px-3 mb-4">
        <Button 
            variant="outline" 
            className="w-full justify-start text-muted-foreground gap-2 relative shadow-sm"
            onClick={() => {
                if (onOpenCommandCenter) onOpenCommandCenter();
                setIsMobileMenuOpen(false);
            }}
        >
            <Search size={16} />
            <span className="text-sm">Buscar...</span>
        </Button>
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

            <div className={cn("px-3 py-4", isCollapsed ? "flex justify-center" : "")}>
                {isCollapsed ? (
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-9 w-9"
                                onClick={onOpenCommandCenter}
                            >
                                <Search size={16} />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Buscar (Cmd+K)</TooltipContent>
                    </Tooltip>
                ) : (
                    <Button 
                        variant="outline" 
                        className="w-full justify-between text-muted-foreground h-9 px-3 shadow-sm bg-gray-50/50 hover:bg-gray-100 border-gray-200"
                        onClick={onOpenCommandCenter}
                    >
                        <span className="flex items-center gap-2">
                            <Search size={14} />
                            <span className="text-sm">Buscar...</span>
                        </span>
                        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-white px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            <span className="text-xs">⌘</span>K
                        </kbd>
                    </Button>
                )}
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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

        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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
            
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onOpenCommandCenter}>
                    <Search size={20} />
                </Button>
            </div>
            </header>

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