import { useState } from "react";
import { UnifiedBookingSystem } from "../booking/UnifiedBookingSystem";
import { CustomerSelector } from "./CustomerSelector";
import { BookingConfig } from "@/types/booking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowLeft } from "lucide-react";

interface SelectedCustomer {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
}

export const AdminBookingSystem = () => {
  const [step, setStep] = useState<'customer' | 'booking'>('customer');
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);

  const adminBookingConfig: BookingConfig = {
    isGuest: false,
    showAuthStep: false,
    allowEmployeeSelection: true,
    showCategories: true,
    maxSteps: 4,
  };

  const handleCustomerSelect = (customer: SelectedCustomer) => {
    setSelectedCustomer(customer);
    setStep('booking');
  };

  const handleBackToCustomer = () => {
    setStep('customer');
    setSelectedCustomer(null);
  };

  if (step === 'customer') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-serif font-bold">Reservar para Cliente</h2>
            <p className="text-muted-foreground">Selecciona un cliente para crear una reserva</p>
          </div>
        </div>

        <CustomerSelector onSelect={handleCustomerSelect} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBackToCustomer}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Cambiar Cliente
              </Button>
              <div>
                <CardTitle>Reservando para: {selectedCustomer?.full_name}</CardTitle>
                <p className="text-sm text-muted-foreground">{selectedCustomer?.email}</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <UnifiedBookingSystem 
        config={adminBookingConfig} 
        selectedCustomer={selectedCustomer}
      />
    </div>
  );
};