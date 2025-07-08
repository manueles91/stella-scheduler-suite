import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { BookingSystem } from "@/components/BookingSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { profile } = useAuth();

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold">Welcome back, {profile?.full_name}!</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Appointments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground">This week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Total Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">0</p>
                  <p className="text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Favorite Service</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-lg font-medium">-</p>
                  <p className="text-muted-foreground">Book your first service!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
        
      case 'bookings':
        return <BookingSystem />;
        
      case 'schedule':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">My Schedule</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Employee schedule view coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'time-tracking':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Time Tracking</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Time tracking features coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-bookings':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">All Bookings</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Admin booking management coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-services':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Manage Services</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Service management coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'admin-staff':
        return (
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-4 sm:mb-6">Manage Staff</h2>
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">Staff management coming soon...</p>
              </CardContent>
            </Card>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </DashboardLayout>
  );
};

export default Dashboard;