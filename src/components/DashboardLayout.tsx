import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Users, Settings, LogOut, Eye, ArrowLeft, Scissors, Tags, UserPlus, CalendarPlus, UsersIcon, DollarSign, Receipt, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'client' | 'employee' | 'admin';
}

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [impersonatedUser, setImpersonatedUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const effectiveProfile = impersonatedUser || profile;
  const isImpersonating = impersonatedUser !== null;

  // Make impersonated user available to child components
  const contextValue = {
    effectiveProfile,
    isImpersonating,
    originalProfile: profile
  };

  // Fetch available users for impersonation (admin only)
  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAvailableUsers();
    }
  }, [profile]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .neq('id', profile?.id) // Exclude current admin
        .order('full_name');

      if (!error && data) {
        setAvailableUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const startImpersonation = (userId: string) => {
    const user = availableUsers.find(u => u.id === userId);
    if (user) {
      setImpersonatedUser(user);
    }
  };

  const stopImpersonation = () => {
    setImpersonatedUser(null);
  };

  const menuItems = [
    { id: 'overview', label: 'Inicio', icon: Calendar },
    ...(effectiveProfile?.role === 'admin' ? [
      { id: 'admin-bookings', label: 'Ingresos', icon: DollarSign },
      { id: 'admin-costs', label: 'Costos', icon: Receipt },
      { id: 'admin-users', label: 'Usuarios', icon: UsersIcon },
      { id: 'admin-feedback', label: 'Feedback', icon: MessageSquare },
      { id: 'admin-settings', label: 'Configuración', icon: Settings },
    ] : []),
    ...(effectiveProfile?.role === 'employee' || effectiveProfile?.role === 'admin' ? [
      { id: 'time-tracking', label: 'Mi agenda', icon: Users },
    ] : []),
    ...(effectiveProfile?.role === 'admin' ? [
      { id: 'admin-services', label: 'Servicios', icon: Scissors },
    ] : []),
    { id: 'bookings', label: 'Reservar', icon: Calendar },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-14 sm:h-16 items-center justify-between px-2 sm:px-6">
          <div className="flex items-center gap-2">
            <button className="sm:hidden p-2" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Open sidebar">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-menu"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <h1 className="text-lg sm:text-2xl font-serif font-bold">Stella Studio</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isImpersonating && (
              <div className="hidden sm:flex items-center space-x-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-lg border border-amber-300">
                <Eye className="h-4 w-4" />
                <span className="text-xs font-medium">Viendo como: {impersonatedUser?.full_name}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>
                  {effectiveProfile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs sm:text-sm">
                <p className="font-medium">{effectiveProfile?.full_name}</p>
                <p className="text-muted-foreground capitalize">{effectiveProfile?.role}</p>
                {isImpersonating && (
                  <p className="text-xs text-amber-600 sm:hidden">Viendo como</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed sm:static top-0 left-0 z-40 h-full w-64 border-r bg-card p-4 transition-transform duration-200 sm:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:h-[calc(100vh-4rem)] sm:block`}>
          <nav className="space-y-2 h-full overflow-y-auto">
            {/* View as dropdown for admins */}
            {profile?.role === 'admin' && (
              <div className="pb-4 border-b">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground px-2">Ver como</p>
                  {isImpersonating ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={stopImpersonation}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Volver a vista admin
                    </Button>
                  ) : (
                    <Select onValueChange={startImpersonation} disabled={loadingUsers}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={loadingUsers ? "Cargando..." : "Seleccionar usuario"} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableUsers.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex flex-col items-start">
                              <span className="font-medium">{user.full_name}</span>
                              <span className="text-xs text-muted-foreground capitalize">{user.role}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            )}

            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => { onTabChange(item.id); setSidebarOpen(false); }}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              );
            })}
            
            {/* Sign out button at the bottom of the sidebar */}
            <div className="pt-4 border-t mt-auto">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </Button>
            </div>
          </nav>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />}
        {/* Main Content */}
        <main className="flex-1 w-full sm:w-auto p-2 sm:p-6">
          <div data-effective-profile={JSON.stringify(effectiveProfile)} data-is-impersonating={isImpersonating}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};