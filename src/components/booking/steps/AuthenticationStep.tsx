import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, CheckCircle } from "lucide-react";

interface AuthenticationStepProps {
  isGuest: boolean;
  user: any;
  customerEmail: string;
  customerName: string;
  onCustomerEmailChange: (email: string) => void;
  onCustomerNameChange: (name: string) => void;
}

export const AuthenticationStep = ({
  isGuest,
  user,
  customerEmail,
  customerName,
  onCustomerEmailChange,
  onCustomerNameChange,
}: AuthenticationStepProps) => {
  if (isGuest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Información de contacto</CardTitle>
          <CardDescription>
            Ingresa tus datos para confirmar la reserva
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerName">Nombre completo</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => onCustomerNameChange(e.target.value)}
              placeholder="Tu nombre completo"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => onCustomerEmailChange(e.target.value)}
              placeholder="tu@email.com"
              required
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inicia sesión o regístrate</CardTitle>
        <CardDescription>
          Para continuar con tu reserva, necesitas una cuenta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {user ? (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-700 dark:text-green-300">
                ¡Sesión iniciada!
              </p>
              <p className="text-sm text-green-600 dark:text-green-400">
                Estás autenticado como {user.email}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-8">
              <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Serás redirigido a la página de autenticación
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};