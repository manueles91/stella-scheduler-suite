import { lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load admin components for better performance
export const AdminServices = lazy(() => 
  import("../admin/AdminServices").then(module => ({ default: module.AdminServices }))
);

export const AdminReservations = lazy(() => 
  import("../admin/AdminReservations").then(module => ({ default: module.AdminReservations }))
);

export const AdminCustomers = lazy(() => 
  import("../admin/AdminCustomers").then(module => ({ default: module.AdminCustomers }))
);

export const AdminStaff = lazy(() => 
  import("../admin/AdminStaff").then(module => ({ default: module.AdminStaff }))
);

export const AdminUsers = lazy(() => 
  import("../admin/AdminUsers").then(module => ({ default: module.AdminUsers }))
);

// Removed AdminDiscounts since it's now integrated into AdminServices

export const AdminCategories = lazy(() => 
  import("../admin/AdminCategories").then(module => ({ default: module.AdminCategories }))
);

export const AdminCosts = lazy(() => 
  import("../admin/AdminCosts").then(module => ({ default: module.AdminCosts }))
);

export const AdminCostCategories = lazy(() => 
  import("../admin/AdminCostCategories").then(module => ({ default: module.AdminCostCategories }))
);

export const AdminSettings = lazy(() => 
  import("../admin/AdminSettings").then(module => ({ default: module.AdminSettings }))
);

// Optimized loading fallback component
export const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-muted-foreground">Cargando panel de administración...</p>
    </div>
  </div>
);