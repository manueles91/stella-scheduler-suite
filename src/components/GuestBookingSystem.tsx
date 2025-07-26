import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: false,
  allowEmployeeSelection: true,
  showCategories: true,
  maxSteps: 5, // Service, Date, Time, Confirmation, Customer Info
};

export const GuestBookingSystem = () => {
  return <UnifiedBookingSystem config={guestConfig} />;
};
