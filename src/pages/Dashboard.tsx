import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EnhancedBookingSystem } from "@/components/EnhancedBookingSystem";
import { AdminReservations } from "@/components/admin/AdminReservations";
import { AdminServices } from "@/components/admin/AdminServices";
import { AdminStaff } from "@/components/admin/AdminStaff";
import AdminDiscounts from "@/components/admin/AdminDiscounts";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { TimeTracking } from "@/components/employee/TimeTracking";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [effectiveProfile, setEffectiveProfile] = useState(profile);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  // Listen for impersonation changes
  useEffect(() => {
    const handleImpersonationChange = () => {
      const mainElement = document.querySelector('[data-effective-profile]');
      if (mainElement) {
        const effectiveProfileData = mainElement.getAttribute('data-effective-profile');
        if (effectiveProfileData) {
          try {
            const parsedProfile = JSON.parse(effectiveProfileData);
            setEffectiveProfile(parsedProfile);
            console.log("Effective profile updated:", parsedProfile);
          } catch (e) {
            console.error("Error parsing effective profile data:", e);
            setEffectiveProfile(profile);
          }
        } else {
          // If no attribute data, fall back to profile
          setEffectiveProfile(profile);
        }
      } else {
        // If no main element found, fall back to profile
        console.warn("Main element with data-effective-profile not found, using profile");
        setEffectiveProfile(profile);
      }
    };

    // Initial check
    handleImpersonationChange();

    // Set up observer for changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        handleImpersonationChange();
      });
    });
    
    const mainElement = document.querySelector('[data-effective-profile]');
    if (mainElement) {
      observer.observe(mainElement, { 
        attributes: true, 
        attributeFilter: ['data-effective-profile'],
        attributeOldValue: true 
      });
    } else {
      // Retry finding the element after a short delay
      setTimeout(() => {
        const retryElement = document.querySelector('[data-effective-profile]');
        if (retryElement) {
          observer.observe(retryElement, { 
            attributes: true, 
            attributeFilter: ['data-effective-profile'],
            attributeOldValue: true 
          });
        }
      }, 100);
    }

    return () => observer.disconnect();
  }, [profile]);

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!effectiveProfile?.id) {
        console.log("No effective profile ID available for fetching appointments");
        return;
      }
      
      setAppointmentsLoading(true);
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('id, appointment_date, start_time, end_time, status, service_id, services(name)')
          .eq('client_id', effectiveProfile.id)
          .order('appointment_date', { ascending: true })
          .order('start_time', { ascending: true });
        
        if (error) {
          console.error("Error fetching appointments:", error);
          setAppointments([]);
        } else {
          setAppointments(data || []);
        }
      } catch (error) {
        console.error("Error in fetchAppointments:", error);
        setAppointments([]);
      } finally {
        setAppointmentsLoading(false);
      }
    };
    
    fetchAppointments();
  }, [effectiveProfile?.id]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif">Cargando...</h2>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <DashboardSummary effectiveProfile={effectiveProfile} />;
        
      case 'bookings':
        return <EnhancedBookingSystem />;
        
      case 'schedule':
        return <EmployeeSchedule employeeId={effectiveProfile?.id} />;
        
      case 'time-tracking':
        return <TimeTracking employeeId={effectiveProfile?.id} />;
        
      case 'admin-bookings':
        return <AdminReservations />;
        
      case 'admin-services':
        return <AdminServices />;
        
      case 'admin-discounts':
        return <AdminDiscounts />;
        
      case 'admin-staff':
        return <AdminStaff />;
        
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