import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";

const guestConfig: BookingConfig = {
  isGuest: true,
  showAuthStep: true,
  allowEmployeeSelection: true,
  showCategories: true,
  maxSteps: 5,
};

export const GuestBookingSystem = () => {
  return <UnifiedBookingSystem config={guestConfig} />;
};
