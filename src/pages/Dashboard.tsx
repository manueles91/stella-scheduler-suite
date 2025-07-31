import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { EnhancedBookingSystem } from "@/components/EnhancedBookingSystem";
import { AdminBookingSystem } from "@/components/admin/AdminBookingSystem";
import { EmployeeSchedule } from "@/components/employee/EmployeeSchedule";
import { TimeTracking } from "@/components/employee/TimeTracking";
import { DashboardSummary } from "@/components/dashboard/DashboardSummary";
import { supabase } from "@/integrations/supabase/client";
import { 
  AdminServices,
  AdminReservations,
  AdminCustomers,
  AdminStaff,
  AdminDiscounts,
  AdminLoadingFallback
} from "@/components/optimized/LazyAdminComponents";

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

  // Memoized appointment fetcher
  const fetchAppointmentsCallback = useCallback(async () => {
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
  }, [effectiveProfile?.id]);

  useEffect(() => {
    fetchAppointmentsCallback();
  }, [fetchAppointmentsCallback]);

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

  // Memoized content renderer
  const renderContent = useMemo(() => {
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
        return (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminReservations />
          </Suspense>
        );
        
      case 'admin-services':
        return (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminServices />
          </Suspense>
        );
        
      case 'admin-discounts':
        return (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminDiscounts />
          </Suspense>
        );
        
      case 'admin-staff':
        return (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminStaff />
          </Suspense>
        );
        
      case 'admin-booking':
        return <AdminBookingSystem />;
        
      case 'admin-customers':
        return (
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminCustomers />
          </Suspense>
        );
        
      default:
        return null;
    }
  }, [activeTab, effectiveProfile?.id]);

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent}
    </DashboardLayout>
  );
};

export default Dashboard;