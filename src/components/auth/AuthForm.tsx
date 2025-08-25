import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, CheckCircle, UserCheck } from "lucide-react";

export const AuthForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState<"unknown" | "exists" | "invited" | "available">("unknown");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const checkEmailExists = async (email: string) => {
    if (!email || !email.includes('@')) {
      setEmailStatus("unknown");
      return;
    }

    setCheckingEmail(true);
    try {
      // Check if user exists by trying to trigger password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`
      });

      // Also check invited users table
      const { data: invitedUser } = await supabase
        .from('invited_users')
        .select('email, account_status')
        .eq('email', email.toLowerCase())
        .single();

      if (invitedUser) {
        setEmailStatus("invited");
      } else if (error && error.message.includes("For security purposes")) {
        // This message indicates email exists
        setEmailStatus("exists");
      } else {
        setEmailStatus("available");
      }
    } catch (e) {
      setEmailStatus("unknown");
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSignUp = async (formData: FormData) => {
    setIsLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    try {
      // First check if email exists
      await checkEmailExists(email);
      
      if (emailStatus === "exists") {
        toast({
          title: "Email ya registrado",
          description: "Esta cuenta ya existe. Intenta iniciar sesión.",
          variant: "destructive",
        });
        return;
      }

      if (emailStatus === "invited") {
        toast({
          title: "Cuenta invitada",
          description: "Tienes una invitación pendiente. Revisa tu email o contacta al administrador.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Email ya registrado",
            description: "Esta cuenta ya existe. Ve a iniciar sesión.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      // Success - redirect immediately (no email confirmation needed)
      if (data.user) {
        toast({
          title: "¡Cuenta creada!",
          description: `Bienvenido ${fullName}`,
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "No se pudo crear la cuenta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async (formData: FormData) => {
    setIsLoading(true);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Credenciales incorrectas",
            description: "Verifica tu email y contraseña.",
            variant: "destructive",
          });
        } else if (error.message.includes("Email not confirmed")) {
          toast({
            title: "Email no confirmado",
            description: "Revisa tu email para confirmar tu cuenta.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error de inicio de sesión",
            description: error.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (data.user) {
        toast({
          title: "¡Bienvenido!",
          description: "Sesión iniciada correctamente.",
        });
        navigate('/dashboard');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStatus = () => {
    if (checkingEmail) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>Verificando email...</AlertDescription>
        </Alert>
      );
    }

    if (emailStatus === "exists") {
      return (
        <Alert variant="destructive">
          <UserCheck className="h-4 w-4" />
          <AlertDescription>
            Este email ya tiene una cuenta. Usa "Iniciar Sesión" en su lugar.
          </AlertDescription>
        </Alert>
      );
    }

    if (emailStatus === "invited") {
      return (
        <Alert className="border-blue-200 bg-blue-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Tienes una invitación pendiente para este email. Revisa tu bandeja de entrada.
          </AlertDescription>
        </Alert>
      );
    }

    if (emailStatus === "available") {
      return (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Email disponible para registro.</AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-white hover:text-white hover:bg-white/10 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Button>
        
        <Card className="shadow-luxury border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif">Stella Studio</CardTitle>
            <CardDescription>
              Tu experiencia de belleza de lujo te espera
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSignIn(formData);
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email" 
                      name="email" 
                      type="email" 
                      placeholder="tu@email.com"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Contraseña</Label>
                    <Input 
                      id="signin-password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••"
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleSignUp(formData);
                }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nombre Completo</Label>
                    <Input 
                      id="signup-name" 
                      name="fullName" 
                      type="text" 
                      placeholder="Tu nombre completo"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email" 
                      name="email" 
                      type="email" 
                      placeholder="tu@email.com"
                      onBlur={(e) => checkEmailExists(e.target.value)}
                      required 
                    />
                    {renderEmailStatus()}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input 
                      id="signup-password" 
                      name="password" 
                      type="password" 
                      placeholder="Mínimo 6 caracteres"
                      required 
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || emailStatus === "exists" || emailStatus === "invited"}
                  >
                    {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};