import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, ShieldCheck, ShieldAlert } from "lucide-react";
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
  const [confirm, setConfirm] = useState("");
  const [signingUp, setSigningUp] = useState(false);

  const appUrl = useMemo(() => `${window.location.origin}/`, []);

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
    if (password !== confirm) {
      toast({
        title: "Las contraseñas no coinciden",
        description: "Revisa los campos.",
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

      const { data, error } = await supabase.auth.signUp({
        email: invite.email,
        password,
        options: {
          emailRedirectTo: appUrl,
          data: invite.full_name ? { full_name: invite.full_name } : undefined,
        },
      });

      if (error) throw error;

      if (data.user && !data.session) {
        // Likely email confirmation required
        toast({
          title: "Revisa tu email",
          description: "Te enviamos un enlace para confirmar tu cuenta.",
          duration: 6000,
        });
        navigate("/auth");
      } else {
        // Session present
        toast({
          title: "¡Bienvenido!",
          description: "Tu cuenta ha sido creada.",
        });
        navigate("/dashboard");
      }
    } catch (e: any) {
      toast({ title: "Error al registrar", description: e?.message, variant: "destructive" });
    } finally {
      setSigningUp(false);
    }
  };

  return (
    <main className="container mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {invite?.status === "valid" ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            Invitación al panel
          </CardTitle>
          <CardDescription>Usa este enlace para crear tu cuenta y acceder.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Validando invitación...
            </div>
          )}

          {!loading && (error || !invite) && (
            <Alert variant="destructive">
              <AlertTitle>No válida</AlertTitle>
              <AlertDescription>{error || "El enlace no es válido."}</AlertDescription>
            </Alert>
          )}

          {!loading && invite && invite.status !== "valid" && (
            <Alert variant="destructive">
              <AlertTitle>
                {invite.status === "expired" ? "Invitación expirada" : "Invitación ya reclamada"}
              </AlertTitle>
              <AlertDescription>
                {invite.status === "expired"
                  ? "Solicita una nueva invitación al administrador."
                  : "Ya usaste este enlace. Inicia sesión con tu email y contraseña."}
              </AlertDescription>
            </Alert>
          )}

          {!loading && invite && invite.status === "valid" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={invite.email} readOnly disabled />
              </div>
              <div className="grid gap-2">
                <Label>Nombre</Label>
                <Input value={invite.full_name ?? ""} readOnly disabled />
              </div>
              <div className="grid gap-2">
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Confirmar contraseña</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={signingUp}>
                {signingUp ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando cuenta...</> : "Crear cuenta"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
};

export default InvitePage;