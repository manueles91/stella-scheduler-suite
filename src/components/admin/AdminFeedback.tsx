import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { uploadToBucket } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, MessageSquare, Bug, Lightbulb, Settings2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackForm {
  page_name: string;
  description: string;
  feedback_type: 'bug' | 'feature_request' | 'improvement';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export const AdminFeedback = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<FeedbackForm>({
    page_name: '',
    description: '',
    feedback_type: 'bug',
    priority: 'medium'
  });

  const handleInputChange = (field: keyof FeedbackForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setScreenshotFile(file);
      } else {
        toast({
          title: "Error",
          description: "Por favor selecciona una imagen válida",
          variant: "destructive"
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    if (!formData.page_name.trim() || !formData.description.trim()) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let screenshotUrl = null;
      
      // Upload screenshot if provided
      if (screenshotFile) {
        screenshotUrl = await uploadToBucket(
          'site-assets',
          'feedback-screenshots',
          screenshotFile
        );
      }

      // Insert feedback into database
      const { error } = await supabase
        .from('admin_feedback')
        .insert({
          admin_id: profile.id,
          page_name: formData.page_name.trim(),
          description: formData.description.trim(),
          feedback_type: formData.feedback_type,
          priority: formData.priority,
          screenshot_url: screenshotUrl
        });

      if (error) throw error;

      toast({
        title: "¡Feedback enviado!",
        description: "Tu comentario ha sido registrado correctamente",
      });

      // Reset form
      setFormData({
        page_name: '',
        description: '',
        feedback_type: 'bug',
        priority: 'medium'
      });
      setScreenshotFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('screenshot-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar el feedback. Intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFeedbackTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="h-4 w-4" />;
      case 'feature_request': return <Lightbulb className="h-4 w-4" />;
      case 'improvement': return <Settings2 className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Feedback del Sistema</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enviar Comentario</CardTitle>
          <p className="text-muted-foreground">
            Comparte bugs, solicitudes de funcionalidades o sugerencias de mejora para el sistema
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="feedback_type">Tipo de Feedback</Label>
                <Select 
                  value={formData.feedback_type} 
                  onValueChange={(value: 'bug' | 'feature_request' | 'improvement') => 
                    handleInputChange('feedback_type', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Bug / Error
                      </div>
                    </SelectItem>
                    <SelectItem value="feature_request">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Solicitud de Función
                      </div>
                    </SelectItem>
                    <SelectItem value="improvement">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        Mejora
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridad</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'critical') => 
                    handleInputChange('priority', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="page_name">Página/Sección</Label>
              <Input
                id="page_name"
                placeholder="Ej: Dashboard Admin, Página de Servicios, etc."
                value={formData.page_name}
                onChange={(e) => handleInputChange('page_name', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                placeholder="Describe detalladamente el problema, funcionalidad solicitada o mejora sugerida..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={5}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="screenshot-upload">Screenshot (Opcional)</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              {screenshotFile && (
                <p className="text-sm text-muted-foreground">
                  Archivo seleccionado: {screenshotFile.name}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Enviando..." : "Enviar Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-sm text-muted-foreground space-y-2">
            <p><strong>Nota:</strong> Este feedback será revisado por el equipo de desarrollo.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Bug className="h-4 w-4 text-red-500" />
                <span><strong>Bug:</strong> Errores o problemas</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                <span><strong>Función:</strong> Nuevas características</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-blue-500" />
                <span><strong>Mejora:</strong> Optimizaciones</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};