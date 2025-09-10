import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types/booking";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { format, addMinutes, parseISO } from "date-fns";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Helper function to handle pending guest booking
  const handlePendingGuestBooking = async (user: User, profile: Profile) => {
    const pendingBookingData = localStorage.getItem('pendingGuestBooking');
    if (!pendingBookingData) return;

    try {
      const bookingData = JSON.parse(pendingBookingData);
      const { service, date, slot, employee, notes } = bookingData;
      
      const bookingDate = new Date(date);
      const startTime = slot.start_time;
      const endTime = format(
        addMinutes(parseISO(`${format(bookingDate, 'yyyy-MM-dd')}T${startTime}`), service.duration_minutes), 
        'HH:mm'
      );

      if (service.type === 'combo') {
        // Handle combo booking
        const { error } = await supabase
          .from('combo_reservations')
          .insert({
            client_id: user.id,
            combo_id: service.id,
            primary_employee_id: slot.employee_id,
            appointment_date: format(bookingDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: notes || null,
            customer_email: user.email,
            customer_name: profile.full_name,
            final_price_cents: service.final_price_cents,
            original_price_cents: service.original_price_cents,
            savings_cents: service.savings_cents || 0,
            is_guest_booking: false
          });

        if (error) throw error;
      } else {
        // Handle individual service booking
        const { error } = await supabase
          .from('reservations')
          .insert({
            client_id: user.id,
            employee_id: slot.employee_id,
            service_id: service.id,
            appointment_date: format(bookingDate, 'yyyy-MM-dd'),
            start_time: startTime,
            end_time: endTime,
            notes: notes || null,
            customer_email: user.email,
            customer_name: profile.full_name,
            final_price_cents: service.final_price_cents
          });

        if (error) throw error;
      }

      // Send confirmation email
      try {
        await supabase.functions.invoke('send-booking-confirmation', {
          body: {
            customerEmail: user.email,
            customerName: profile.full_name,
            serviceName: service.name,
            appointmentDate: format(bookingDate, 'yyyy-MM-dd'),
            appointmentTime: startTime,
            employeeName: employee?.full_name || slot.employee_name,
            isGuestBooking: false,
            notes: notes
          }
        });
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
      }

      localStorage.removeItem('pendingGuestBooking');
      
      toast({
        title: "¡Reserva confirmada!",
        description: "Tu cita ha sido reservada exitosamente tras iniciar sesión.",
      });

      // Navigate to dashboard
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (error) {
      console.error('Error creating booking from pending guest booking:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al confirmar tu reserva. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
      localStorage.removeItem('pendingGuestBooking');
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            setProfile(profileData);
            setLoading(false);

            // Handle pending guest booking after profile is loaded
            if (profileData && event === 'SIGNED_IN') {
              await handlePendingGuestBooking(session.user, profileData);
            }
          }, 0);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profileData }) => {
            setProfile(profileData);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const cleanupAuthState = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      Object.keys(sessionStorage || {}).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
  };

  const signOut = async () => {
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: 'global' as any });
      } catch {}
    } finally {
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};