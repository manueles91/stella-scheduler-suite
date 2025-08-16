import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: false,
  allowEmployeeSelection: true,
  showCategories: true,
  maxSteps: 4, // Service, Date, Time, Customer Info (removed Confirmation as separate step)
};

export const GuestBookingSystem = () => {
  return <UnifiedBookingSystem config={guestConfig} />;
};
