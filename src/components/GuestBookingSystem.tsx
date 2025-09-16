import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { EnhancedBookingSystem } from "./EnhancedBookingSystem";
import { BookingConfig } from "@/types/booking";
import { BookingProvider } from "@/contexts/BookingContext";
import { useAuth } from "@/contexts/AuthContext";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: false,
  allowEmployeeSelection: false, // Changed from true to false - employee selection happens later in booking flow
  showCategories: true,
  maxSteps: 4, // Service, Date, Time, Customer Info (removed Confirmation as separate step)
};

export const GuestBookingSystem = () => {
  // If a user is signed in, show the authenticated booking flow instead
  // This prevents showing guest-only prompts like "¿Ya tienes cuenta?"
  // while still keeping the same route (/book)
  const { user } = useAuth();
  
  return (
    <BookingProvider>
      {user ? <EnhancedBookingSystem /> : <UnifiedBookingSystem config={guestConfig} />}
    </BookingProvider>
  );
};
