import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, User, Mail, Phone } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const RegistrationClaimPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reservations, setReservations] = useState<any[]>([]);
  const [customerEmail, setCustomerEmail] = useState("");
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      fetchReservationData();
    } else {
      setError("Token de registro no válido");
      setLoading(false);
    }
  }, [token]);

  const fetchReservationData = async () => {
    try {
      // Fetch guest reservations with this token
      const { data: reservation, error } = await supabase
        .from('reservations')
        .select(`
          *,
          services(name, duration_minutes)
        `)
        .eq('registration_token', token)
        .single();

      if (error || !reservation) {
        setError("Token de registro no válido o expirado");
        return;
      }

      setCustomerEmail(reservation.customer_email);
      setFormData(prev => ({ 
        ...prev, 
        fullName: reservation.customer_name || "" 
      }));

      // Fetch all reservations for this email
      const { data: allReservations } = await supabase
        .from('reservations')
        .select(`
          *,
          services(name, duration_minutes, price_cents)
        `)
        .eq('customer_email', reservation.customer_email)
        .eq('is_guest_booking', true)
        .order('appointment_date', { ascending: true });

      setReservations(allReservations || []);
    } catch (error) {
      console.error('Error fetching reservation data:', error);
      setError("Error al cargar la información de reserva");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (formData.password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: customerEmail,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone
          }
        }
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      if (authData.user) {
        // The claim_invited_profile function will automatically:
        // 1. Claim the invited/guest user profile
        // 2. Link all past guest bookings to the new user
        // 3. Update the profile with the correct data
        
        toast({
          title: "¡Registro completado!",
          description: "Tu cuenta ha sido creada exitosamente. Ahora puedes gestionar tus citas desde el panel de usuario.",
        });

        // Redirect to dashboard
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError("Error al crear la cuenta. Por favor intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (error && !customerEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Completa tu Registro</h1>
          <p className="text-muted-foreground">
            Crea tu cuenta para gestionar mejor tus citas futuras
          </p>
        </div>

        {/* Existing Reservations */}
        {reservations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Tus Citas Existentes
              </CardTitle>
              <CardDescription>
                Al completar tu registro, podrás gestionar estas citas desde tu panel de usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reservations.map((reservation) => (
                  <div key={reservation.id} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{reservation.services?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(reservation.appointment_date).toLocaleDateString('es-ES')} a las {reservation.start_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        €{((reservation.services?.price_cents || 0) / 100).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {reservation.services?.duration_minutes}min
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Información de la Cuenta</CardTitle>
            <CardDescription>
              Completa los datos para crear tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    disabled
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fullName">Nombre Completo *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Teléfono (opcional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="pl-10"
                    placeholder="+34 600 000 000"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  required
                  minLength={6}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  Registrarme más tarde
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !formData.fullName || !formData.password}
                  className="flex-1"
                >
                  {submitting ? "Creando cuenta..." : "Crear Cuenta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationClaimPage;
