import { UnifiedBookingSystem } from "./booking/UnifiedBookingSystem";
import { BookingConfig } from "@/types/booking";

const authenticatedConfig: BookingConfig = {
  isGuest: false,
  showAuthStep: false,
  allowEmployeeSelection: true,
  showCategories: true,
  maxSteps: 4,
};

export const EnhancedBookingSystem = () => {
  return <UnifiedBookingSystem config={authenticatedConfig} />;
};