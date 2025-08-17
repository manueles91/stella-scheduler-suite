import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";
import { BookingProvider } from "@/contexts/BookingContext";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: false,
  allowEmployeeSelection: true,
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
