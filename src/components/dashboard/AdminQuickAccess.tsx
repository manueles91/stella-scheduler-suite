import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { 
  NewAppointmentDialog, 
  NewSaleDialog, 
  NewCostDialog, 
  NewUserDialog 
} from "@/components/admin/quick-access";

interface AdminQuickAccessProps {
  effectiveProfile: any;
}

export const AdminQuickAccess = ({ effectiveProfile }: AdminQuickAccessProps) => {

  // Show for admins and employees, but with different options
  if (effectiveProfile?.role !== 'admin' && effectiveProfile?.role !== 'employee') {
    return null;
  }

  const isAdmin = effectiveProfile?.role === 'admin';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Acceso Rápido
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NewAppointmentDialog effectiveProfile={effectiveProfile} />
          {isAdmin && <NewSaleDialog effectiveProfile={effectiveProfile} />}
          {isAdmin && <NewCostDialog effectiveProfile={effectiveProfile} />}
          <NewUserDialog effectiveProfile={effectiveProfile} />
        </div>
      </CardContent>
    </Card>
  );
};
