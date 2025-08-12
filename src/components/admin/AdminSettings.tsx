import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ImageUp, Image as ImageIcon, Save } from "lucide-react";

export const AdminSettings = () => {
  const { toast } = useToast();
  const { settings, refetch } = useSiteSettings();
  const [uploading, setUploading] = useState<{ logo: boolean; bg: boolean }>({ logo: false, bg: false });

  const uploadFile = async (file: File, folder: string) => {
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${folder}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });
    if (error) throw error;
    const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveSetting = async (partial: { logo_url?: string | null; landing_background_url?: string | null }) => {
    const { data: existing, error: selectError } = await supabase
      .from("site_settings")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (selectError) throw selectError;

    const payload = { ...partial, updated_at: new Date().toISOString() } as any;

    if (existing && existing[0]?.id) {
      const { error } = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", existing[0].id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("site_settings")
        .insert(payload);
      if (error) throw error;
    }
  };

  const onLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading((u) => ({ ...u, logo: true }));
      const url = await uploadFile(file, "logos");
      await saveSetting({ logo_url: url });
      await refetch();
      toast({ title: "Logo actualizado", description: "El logo del salón se ha actualizado correctamente." });
    } catch (err: any) {
      toast({ title: "Error al subir logo", description: err.message || "Intenta nuevamente", variant: "destructive" });
    } finally {
      setUploading((u) => ({ ...u, logo: false }));
      e.target.value = "";
    }
  };

  const onBackgroundChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading((u) => ({ ...u, bg: true }));
      const url = await uploadFile(file, "backgrounds");
      await saveSetting({ landing_background_url: url });
      await refetch();
      toast({ title: "Fondo actualizado", description: "La imagen de fondo se ha actualizado correctamente." });
    } catch (err: any) {
      toast({ title: "Error al subir fondo", description: err.message || "Intenta nuevamente", variant: "destructive" });
    } finally {
      setUploading((u) => ({ ...u, bg: false }));
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold">Configuración</h2>
        <p className="text-muted-foreground">Gestiona el logo y la imagen de fondo de la página de inicio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Logo del salón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center bg-muted/30 rounded-md p-4 min-h-[120px]">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo del salón" className="h-24 w-auto object-contain" />
              ) : (
                <div className="text-center text-muted-foreground text-sm">Aún no se ha configurado un logo.</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={onLogoChange} disabled={uploading.logo} />
              <Button type="button" variant="secondary" disabled={uploading.logo}>
                <ImageUp className="h-4 w-4 mr-2" /> Subir
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Fondo de la portada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center bg-muted/30 rounded-md p-4 min-h-[120px]">
              {settings?.landing_background_url ? (
                <img src={settings.landing_background_url} alt="Imagen de fondo de la portada" className="h-24 w-auto object-cover" />
              ) : (
                <div className="text-center text-muted-foreground text-sm">Aún no se ha configurado la imagen de fondo.</div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Input type="file" accept="image/*" onChange={onBackgroundChange} disabled={uploading.bg} />
              <Button type="button" variant="secondary" disabled={uploading.bg}>
                <ImageUp className="h-4 w-4 mr-2" /> Subir
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
