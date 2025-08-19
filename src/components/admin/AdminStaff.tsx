import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Users, Mail, Phone, UserCheck, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Profile, Service } from "@/types/booking";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
interface EmployeeService {
  employee_id: string;
  service_id: string;
  services: {
    name: string;
  };
}
export const AdminStaff = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employeeServices, setEmployeeServices] = useState<EmployeeService[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "employee" as "client" | "employee" | "admin"
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const {
    toast
  } = useToast();
  useEffect(() => {
    fetchData();
  }, []);
  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchProfiles(), fetchServices(), fetchEmployeeServices()]);
    setLoading(false);
  };
  const fetchProfiles = async () => {
    const {
      data,
      error
    } = await supabase.from('profiles').select('*').in('role', ['employee', 'admin']).order('full_name');
    if (error) {
      toast({
        title: "Error",
        description: "Failed to load staff profiles",
        variant: "destructive"
      });
    } else {
      setProfiles(data || []);
    }
  };
  const fetchServices = async () => {
    const {
      data,
      error
    } = await supabase.from('services').select('id, name').eq('is_active', true).order('name');
    if (error) {
      console.error('Error fetching services:', error);
    } else {
      setServices(data || []);
    }
  };
  const fetchEmployeeServices = async () => {
    const {
      data,
      error
    } = await supabase.from('employee_services').select(`
        employee_id,
        service_id,
        services(name)
      `);
    if (error) {
      console.error('Error fetching employee services:', error);
    } else {
      setEmployeeServices(data || []);
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.email.trim()) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive"
      });
      return;
    }
    try {
      if (editingProfile) {
        const {
          error
        } = await supabase.from('profiles').update(formData).eq('id', editingProfile.id);
        if (error) throw error;
        toast({
          title: "Éxito",
          description: "Perfil actualizado correctamente"
        });
      } else {
        // For creating new users, we would need to handle auth.users creation
        // This is typically done through Supabase Admin API or invitation system
        toast({
          title: "Información",
          description: "La creación de nuevos usuarios requiere configuración adicional",
          variant: "default"
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el perfil",
        variant: "destructive"
      });
    }
  };
  const handleEdit = (profile: Profile) => {
    setEditingProfile(profile);
    setFormData({
      email: profile.email,
      full_name: profile.full_name,
      phone: profile.phone || "",
      role: profile.role
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (file: File, profileId: string) => {
    setUploadingImage(true);
    try {
      const fileName = `profiles/${profileId}`;
      const { error: uploadError } = await supabase.storage
        .from('service-images')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('service-images')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ image_url: publicUrl } as any)
        .eq('id', profileId);

      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Imagen actualizada correctamente"
      });
      
      fetchProfiles();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al subir la imagen",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };
  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      phone: "",
      role: "employee"
    });
    setEditingProfile(null);
  };
  const openServicesDialog = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const currentServices = employeeServices.filter(es => es.employee_id === employeeId).map(es => es.service_id);
    setSelectedServiceIds(currentServices);
    setServicesDialogOpen(true);
  };
  const handleServiceToggle = (serviceId: string) => {
    setSelectedServiceIds(prev => prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]);
  };
  const saveEmployeeServices = async () => {
    try {
      // First, delete existing employee services
      await supabase.from('employee_services').delete().eq('employee_id', selectedEmployeeId);

      // Then, insert new ones
      if (selectedServiceIds.length > 0) {
        const insertData = selectedServiceIds.map(serviceId => ({
          employee_id: selectedEmployeeId,
          service_id: serviceId
        }));
        const {
          error
        } = await supabase.from('employee_services').insert(insertData);
        if (error) throw error;
      }
      toast({
        title: "Éxito",
        description: "Servicios actualizados correctamente"
      });
      setServicesDialogOpen(false);
      fetchEmployeeServices();
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar servicios",
        variant: "destructive"
      });
    }
  };
  const getEmployeeServices = (employeeId: string) => {
    return employeeServices.filter(es => es.employee_id === employeeId).map(es => es.services.name);
  };
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'employee':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (loading) {
    return <div className="space-y-4">
        <h2 className="text-3xl font-serif font-bold">Gestión de Personal</h2>
        <div className="text-center py-8">Cargando personal...</div>
      </div>;
  }
  return <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold">Personal</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Empleado
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingProfile ? "Editar Empleado" : "Nuevo Empleado"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nombre completo *</Label>
                <Input id="full_name" value={formData.full_name} onChange={e => setFormData({
                ...formData,
                full_name: e.target.value
              })} placeholder="Nombre completo" required />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData({
                ...formData,
                email: e.target.value
              })} placeholder="email@ejemplo.com" required disabled={!!editingProfile} // Don't allow email changes
              />
              </div>

              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({
                ...formData,
                phone: e.target.value
              })} placeholder="+1234567890" />
              </div>

              <div>
                <Label htmlFor="role">Rol *</Label>
                <Select value={formData.role} onValueChange={(value: "client" | "employee" | "admin") => setFormData({
                ...formData,
                role: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Empleado</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingProfile ? "Actualizar" : "Crear"} Empleado
                </Button>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Assignment Dialog */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Asignar Servicios</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los servicios que puede realizar este miembro del personal:
            </p>
            <div className="space-y-2">
              {services.map(service => <div key={service.id} className="flex items-center space-x-2">
                  <Checkbox id={service.id} checked={selectedServiceIds.includes(service.id)} onCheckedChange={() => handleServiceToggle(service.id)} />
                  <Label htmlFor={service.id}>{service.name}</Label>
                </div>)}
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={saveEmployeeServices} className="flex-1">
                Guardar Servicios
              </Button>
              <Button type="button" variant="outline" onClick={() => setServicesDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map(profile => <Card key={profile.id}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.image_url} />
                      <AvatarFallback>
                        {profile.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <label className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 cursor-pointer hover:bg-primary/80 transition-colors">
                      <Upload className="h-3 w-3" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(file, profile.id);
                        }}
                        disabled={uploadingImage}
                      />
                    </label>
                  </div>
                  <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(profile)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4" />
                  {profile.email}
                </div>
                {profile.phone && <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {profile.phone}
                  </div>}
              </div>
              
              <div className="flex justify-between items-center">
                <Badge className={getRoleColor(profile.role)}>
                  {profile.role === 'admin' ? 'Administrador' : 'Empleado'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>

              {(profile.role === 'employee' || profile.role === 'admin') && <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Servicios:</span>
                    <Button variant="outline" size="sm" onClick={() => openServicesDialog(profile.id)}>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Asignar
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getEmployeeServices(profile.id).length > 0 ? getEmployeeServices(profile.id).map((serviceName, index) => <Badge key={index} variant="secondary" className="text-xs">
                          {serviceName}
                        </Badge>) : <span className="text-xs text-muted-foreground">Sin servicios asignados</span>}
                  </div>
                </div>}
            </CardContent>
          </Card>)}
      </div>

      {profiles.length === 0 && <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No hay empleados registrados aún.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Agrega empleados para gestionar el personal.
            </p>
          </CardContent>
        </Card>}
    </div>;
};