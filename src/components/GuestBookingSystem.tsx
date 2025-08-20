import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";
import { BookingProvider } from "@/contexts/BookingContext";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: false,
  allowEmployeeSelection: false, // Changed from true to false - employee selection happens later in booking flow
  showCategories: true,
  maxSteps: 4, // Service, Date, Time, Customer Info (removed Confirmation as separate step)
};

export const GuestBookingSystem = () => {
  return (
    <BookingProvider>
      <UnifiedBookingSystem config={guestConfig} />
    </BookingProvider>
  );
};
