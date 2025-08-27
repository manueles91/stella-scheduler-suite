import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket } from "@/lib/storage";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { ImageUp, Image as ImageIcon, Save, Building, Clock, Star, MapPin } from "lucide-react";

export const AdminSettings = () => {
  const { toast } = useToast();
  const { settings, refetch } = useSiteSettings();
  const [uploading, setUploading] = useState<{ logo: boolean; bg: boolean; pwa: boolean }>({ logo: false, bg: false, pwa: false });
  const [saving, setSaving] = useState(false);
  
  // Form states for editable fields
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    google_maps_link: '',
    hero_title: '',
    hero_subtitle: ''
  });
  
  const [businessHours, setBusinessHours] = useState<Record<string, string>>({
    lunes: '9:00 AM - 6:00 PM',
    martes: '9:00 AM - 6:00 PM',
    miércoles: '9:00 AM - 6:00 PM',
    jueves: '9:00 AM - 6:00 PM',
    viernes: '9:00 AM - 6:00 PM',
    sábado: '9:00 AM - 4:00 PM',
    domingo: 'Cerrado'
  });
  
  const [testimonials, setTestimonials] = useState([
    { id: 1, name: '', text: '', rating: 5, service: '' }
  ]);

  // Update form states when settings load
  useEffect(() => {
    if (settings) {
      setBusinessInfo({
        business_name: settings.business_name || '',
        business_address: settings.business_address || '',
        business_phone: settings.business_phone || '',
        business_email: settings.business_email || '',
        google_maps_link: settings.google_maps_link || '',
        hero_title: settings.hero_title || '',
        hero_subtitle: settings.hero_subtitle || ''
      });
      setBusinessHours({
        ...{
          lunes: '9:00 AM - 6:00 PM',
          martes: '9:00 AM - 6:00 PM',
          miércoles: '9:00 AM - 6:00 PM',
          jueves: '9:00 AM - 6:00 PM',
          viernes: '9:00 AM - 6:00 PM',
          sábado: '9:00 AM - 4:00 PM',
          domingo: 'Cerrado'
        },
        ...settings.business_hours
      });
      setTestimonials(settings.testimonials.length > 0 ? settings.testimonials : [
        { id: 1, name: '', text: '', rating: 5, service: '' }
      ]);
    }
  }, [settings]);

  const uploadFile = async (file: File, folder: string) => {
    return uploadToBucket('site-assets', folder, file);
  };

  const saveSetting = async (partial: any) => {
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
  
  const saveBusinessInfo = async () => {
    try {
      setSaving(true);
      await saveSetting({
        ...businessInfo,
        business_hours: businessHours,
        testimonials: testimonials
      });
      await refetch();
      toast({ 
        title: "Configuración guardada", 
        description: "La información del salón se ha actualizado correctamente." 
      });
    } catch (err: any) {
      toast({ 
        title: "Error al guardar", 
        description: err.message || "Intenta nuevamente", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };
  
  const addTestimonial = () => {
    const newId = Math.max(...testimonials.map(t => t.id || 0), 0) + 1;
    setTestimonials([...testimonials, { 
      id: newId, 
      name: '', 
      text: '', 
      rating: 5, 
      service: '' 
    }]);
  };
  
  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };
  
  const updateTestimonial = (index: number, field: string, value: any) => {
    const updated = testimonials.map((t, i) => 
      i === index ? { ...t, [field]: value } : t
    );
    setTestimonials(updated);
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

  const onPwaIconChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading((u) => ({ ...u, pwa: true }));
      const url = await uploadFile(file, "pwa-icons");
      await saveSetting({ pwa_icon_url: url });
      await refetch();
      toast({ title: "Ícono de app actualizado", description: "El ícono de la aplicación se ha actualizado correctamente." });
    } catch (err: any) {
      toast({ title: "Error al subir ícono", description: err.message || "Intenta nuevamente", variant: "destructive" });
    } finally {
      setUploading((u) => ({ ...u, pwa: false }));
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold">Configuración del Salón</h2>
        <Button onClick={saveBusinessInfo} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Guardando..." : "Guardar Configuración"}
        </Button>
      </div>

      {/* Images Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" /> Logo del salón</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center bg-muted/30 rounded-md p-3 min-h-[80px]">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo del salón" className="h-16 w-auto object-contain" />
              ) : (
                <div className="text-center text-muted-foreground text-xs">No configurado</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={onLogoChange} disabled={uploading.logo} className="text-xs" />
              <Button type="button" variant="secondary" size="sm" disabled={uploading.logo}>
                <ImageUp className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" /> Fondo de portada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center bg-muted/30 rounded-md p-3 min-h-[80px]">
              {settings?.landing_background_url ? (
                <img src={settings.landing_background_url} alt="Imagen de fondo" className="h-16 w-auto object-cover rounded" />
              ) : (
                <div className="text-center text-muted-foreground text-xs">No configurado</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={onBackgroundChange} disabled={uploading.bg} className="text-xs" />
              <Button type="button" variant="secondary" size="sm" disabled={uploading.bg}>
                <ImageUp className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm"><ImageIcon className="h-4 w-4" /> Ícono de App</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center bg-muted/30 rounded-md p-3 min-h-[80px]">
              {settings?.pwa_icon_url ? (
                <img src={settings.pwa_icon_url} alt="Ícono de la aplicación" className="h-16 w-16 object-cover rounded-xl" />
              ) : (
                <div className="text-center text-muted-foreground text-xs">No configurado</div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input type="file" accept="image/*" onChange={onPwaIconChange} disabled={uploading.pwa} className="text-xs" />
              <Button type="button" variant="secondary" size="sm" disabled={uploading.pwa}>
                <ImageUp className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Recomendado: 512x512 px
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Business Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building className="h-5 w-5" /> Información del Salón</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del salón</Label>
              <Input 
                value={businessInfo.business_name}
                onChange={(e) => setBusinessInfo({...businessInfo, business_name: e.target.value})}
                placeholder="Salón de Belleza"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input 
                value={businessInfo.business_phone}
                onChange={(e) => setBusinessInfo({...businessInfo, business_phone: e.target.value})}
                placeholder="+506 1234-5678"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                value={businessInfo.business_email}
                onChange={(e) => setBusinessInfo({...businessInfo, business_email: e.target.value})}
                placeholder="info@salon.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input 
                value={businessInfo.business_address}
                onChange={(e) => setBusinessInfo({...businessInfo, business_address: e.target.value})}
                placeholder="Dirección del salón"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Enlace de Google Maps</Label>
              <Input 
                value={businessInfo.google_maps_link}
                onChange={(e) => setBusinessInfo({...businessInfo, google_maps_link: e.target.value})}
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Sección Principal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título principal</Label>
            <Input 
              value={businessInfo.hero_title}
              onChange={(e) => setBusinessInfo({...businessInfo, hero_title: e.target.value})}
              placeholder="Bienvenida a tu Salón de Belleza"
            />
          </div>
          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Textarea 
              value={businessInfo.hero_subtitle}
              onChange={(e) => setBusinessInfo({...businessInfo, hero_subtitle: e.target.value})}
              placeholder="Tratamientos profesionales de belleza..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Horario de Atención</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(businessHours).map(([day, hours]) => (
              <div key={day} className="space-y-2">
                <Label className="capitalize">{day}</Label>
                <Input 
                  value={hours as string}
                  onChange={(e) => setBusinessHours({...businessHours, [day]: e.target.value})}
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testimonials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Star className="h-5 w-5" /> Testimonios de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {testimonials.map((testimonial, index) => (
            <div key={testimonial.id} className="border border-border/40 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Testimonio {index + 1}</h4>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => removeTestimonial(index)}
                  disabled={testimonials.length === 1}
                >
                  Eliminar
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre del cliente</Label>
                  <Input 
                    value={testimonial.name}
                    onChange={(e) => updateTestimonial(index, 'name', e.target.value)}
                    placeholder="Nombre del cliente"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Servicio</Label>
                  <Input 
                    value={testimonial.service}
                    onChange={(e) => updateTestimonial(index, 'service', e.target.value)}
                    placeholder="Servicio recibido"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Testimonio</Label>
                  <Textarea 
                    value={testimonial.text}
                    onChange={(e) => updateTestimonial(index, 'text', e.target.value)}
                    placeholder="Comentario del cliente..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addTestimonial} className="w-full">
            Agregar Testimonio
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
