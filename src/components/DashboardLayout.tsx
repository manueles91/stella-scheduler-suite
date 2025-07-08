import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Clock, Users, Settings, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const DashboardLayout = ({ children, activeTab, onTabChange }: DashboardLayoutProps) => {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'bookings', label: 'My Bookings', icon: Calendar },
    ...(profile?.role === 'employee' || profile?.role === 'admin' ? [
      { id: 'schedule', label: 'My Schedule', icon: Clock },
      { id: 'time-tracking', label: 'Time Tracking', icon: Clock },
    ] : []),
    ...(profile?.role === 'admin' ? [
      { id: 'admin-bookings', label: 'All Bookings', icon: Calendar },
      { id: 'admin-services', label: 'Services', icon: Settings },
      { id: 'admin-staff', label: 'Staff', icon: Users },
    ] : []),
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
            <div className="flex items-center space-x-2">
              <Avatar>
                <AvatarFallback>
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-xs sm:text-sm">
                <p className="font-medium">{profile?.full_name}</p>
                <p className="text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed sm:static top-0 left-0 z-40 h-full w-64 border-r bg-card p-4 transition-transform duration-200 sm:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} sm:h-[calc(100vh-4rem)] sm:block`}>
          <nav className="space-y-2">
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
          </nav>
        </aside>
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 sm:hidden" onClick={() => setSidebarOpen(false)} />}
        {/* Main Content */}
        <main className="flex-1 p-2 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};