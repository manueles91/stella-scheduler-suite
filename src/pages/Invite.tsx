import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Loader2, ShieldCheck, ShieldAlert, Eye, EyeOff, CheckCircle, XCircle, ArrowLeft, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InviteData {
  email: string;
  full_name: string | null;
  role: string;
  invited_at: string | null;
  expires_at: string | null;
  claimed_at: string | null;
  status: "valid" | "expired" | "claimed";
}

const cleanupAuthState = () => {
  try {
    // Remove known supabase keys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage || {}).forEach((key) => {
      if (key.startsWith("supabase.auth.") || key.includes("sb-")) {
        sessionStorage.removeItem(key);
      }
    });
  } catch {}
};

const InvitePage = () => {
  const [search] = useSearchParams();
  const token = search.get("token") || "";
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [signingUp, setSigningUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState("");

  const appUrl = useMemo(() => `${window.location.origin}/`, []);

  // Password strength validation
  const validatePassword = (pwd: string) => {
    let strength = 0;
    let feedback = "";

    if (pwd.length >= 8) strength += 25;
    if (/[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd)) strength += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) strength += 25;

    if (pwd.length < 6) {
      feedback = "Muy corta (mínimo 6 caracteres)";
    } else if (strength < 50) {
      feedback = "Débil - Agrega mayúsculas y números";
    } else if (strength < 75) {
      feedback = "Regular - Agrega símbolos";
    } else {
      feedback = "Fuerte";
    }

    setPasswordStrength(strength);
    setPasswordFeedback(feedback);
  };

  useEffect(() => {
    validatePassword(password);
  }, [password]);

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token) {
        setError("Falta el token de invitación.");
        setLoading(false);
        return;
      }
      try {
        const { data, error: fnErr } = await supabase.functions.invoke(
          "invites-lookup",
          { body: { token } }
        );
        if (fnErr) throw fnErr;
        setInvite(data as InviteData);
      } catch (e: any) {
        setError(e?.message || "No se pudo validar la invitación.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  useEffect(() => {
    document.title = "Aceptar invitación | Panel";
  }, []);
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || invite.status !== "valid") return;
    
    if (password.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "Usa al menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setSigningUp(true);
    try {
      cleanupAuthState();
      try {
        await supabase.auth.signOut({ scope: "global" as any });
      } catch {}

      // Check if user already exists first
      const { data: existingUser } = await supabase.auth.signInWithPassword({
        email: invite.email,
        password: "temp"
      });

      if (existingUser?.user) {
        toast({
          title: "Usuario ya existe",
          description: "Esta cuenta ya existe. Intenta iniciar sesión.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: appUrl,
          data: invite.full_name ? { full_name: invite.full_name } : undefined,
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Usuario ya registrado",
            description: "Esta cuenta ya existe. Ve a iniciar sesión.",
            variant: "destructive",
          });
          navigate("/auth");
          return;
        }
        throw error;
      }

      // Success - user should be logged in immediately (no email confirmation)
      if (data.user) {
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: `Bienvenido ${invite.full_name || invite.email}`,
        });
        navigate("/dashboard");
      }
    } catch (e: any) {
      let errorMessage = e?.message || "Error desconocido al crear la cuenta";
      
      if (errorMessage.includes("Invalid login credentials")) {
        // This means user doesn't exist yet, which is good for signup
        try {
          const { data, error } = await supabase.auth.signUp({
            email: invite.email,
            password,
            options: {
              emailRedirectTo: appUrl,
              data: invite.full_name ? { full_name: invite.full_name } : undefined,
            },
          });

          if (error) throw error;

          toast({
            title: "¡Cuenta creada exitosamente!",
            description: `Bienvenido ${invite.full_name || invite.email}`,
          });
          navigate("/dashboard");
        } catch (signupError: any) {
          toast({ 
            title: "Error al crear cuenta", 
            description: signupError?.message || "No se pudo crear la cuenta",
            variant: "destructive" 
          });
        }
      } else {
        toast({ 
          title: "Error al crear cuenta", 
          description: errorMessage,
          variant: "destructive" 
        });
      }
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/auth')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al login
        </Button>

        <Card className="shadow-xl border-0 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-primary">
              {invite?.status === "valid" ? <ShieldCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
              <Smartphone className="h-5 w-5" />
            </div>
            <CardTitle className="text-xl font-semibold">Crear tu cuenta</CardTitle>
            <CardDescription className="text-sm">
              Completa tu registro para acceder al panel
            </CardDescription>
          </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando invitación...
            </div>
          )}

          {!loading && (error || !invite) && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Invitación no válida</AlertTitle>
                <AlertDescription>{error || "El enlace no es válido o ha expirado."}</AlertDescription>
              </Alert>
              <div className="flex flex-col gap-2">
                <Button onClick={() => navigate("/auth")} className="w-full">
                  Ir a iniciar sesión
                </Button>
                <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
                  Intentar de nuevo
                </Button>
              </div>
            </div>
          )}

          {!loading && invite && invite.status !== "valid" && (
            <div className="space-y-4">
              <Alert variant="destructive" className="border-l-4 border-l-destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>
                  {invite.status === "expired" ? "Invitación expirada" : "Invitación ya reclamada"}
                </AlertTitle>
                <AlertDescription>
                  {invite.status === "expired"
                    ? "Esta invitación ha expirado. Solicita una nueva al administrador."
                    : "Ya usaste este enlace. Puedes iniciar sesión con tu email y contraseña."}
                </AlertDescription>
              </Alert>
              <Button onClick={() => navigate("/auth")} className="w-full">
                Ir a iniciar sesión
              </Button>
            </div>
          )}

          {!loading && invite && invite.status === "valid" && (
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Invitación válida
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>Email:</strong> {invite.email}</p>
                  <p><strong>Nombre:</strong> {invite.full_name || "No especificado"}</p>
                  <p><strong>Rol:</strong> <span className="capitalize">{invite.role}</span></p>
                  {invite.expires_at && (
                    <p><strong>Expira:</strong> {new Date(invite.expires_at).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Crea tu contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa una contraseña segura"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {password && (
                    <div className="space-y-2">
                      <Progress 
                        value={passwordStrength} 
                        className="h-2"
                      />
                      <p className={`text-xs ${
                        passwordStrength >= 75 ? 'text-green-600' : 
                        passwordStrength >= 50 ? 'text-yellow-600' : 
                        'text-red-600'
                      }`}>
                        {passwordFeedback}
                      </p>
                    </div>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={signingUp || password.length < 6}
                >
                  {signingUp ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando cuenta...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Crear mi cuenta
                    </>
                  )}
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                Al crear tu cuenta aceptas los términos y condiciones
              </div>
            </div>
          )}
        </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default InvitePage;