import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserData, QuickAccessDialogProps } from "./types";

export const NewUserDialog = ({ effectiveProfile }: QuickAccessDialogProps) => {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [userData, setUserData] = useState<UserData>({
    email: "",
    full_name: "",
    phone: "",
    role: "client"
  });

  const createNewUser = async () => {
    if (!userData.email || !userData.full_name) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    // Validate phone number if provided
    if (userData.phone && userData.phone.trim()) {
      const phoneRegex = /^(\+506|00506|506)?[2-9]\d{7}$/;
      if (!phoneRegex.test(userData.phone.replace(/\s+/g, ""))) {
        toast({
          title: "Error",
          description: "Formato de teléfono inválido (ej: 88887777 o +506 88887777)",
          variant: "destructive"
        });
        return;
      }
    }

    try {
      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userData.email)
        .single();

      if (existingUser) {
        toast({
          title: "Error",
          description: "El email ya está registrado",
          variant: "destructive"
        });
        return;
      }

      // Create new user profile
      const userId = crypto.randomUUID();
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone || null,
          role: userData.role,
          account_status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Usuario creado exitosamente"
      });

      setShowDialog(false);
      setUserData({
        email: "",
        full_name: "",
        phone: "",
        role: "client"
      });
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: "Error al crear el usuario",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="h-20 flex flex-col gap-2"
        >
          <UserPlus className="h-5 w-5" />
          <span className="text-sm">Nuevo Usuario</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="user-description">
        <DialogHeader>
          <DialogTitle>Nuevo Usuario</DialogTitle>
        </DialogHeader>
        <div className="space-y-4" id="user-description">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={userData.email}
              onChange={(e) => setUserData({...userData, email: e.target.value})}
              placeholder="usuario@ejemplo.com"
            />
          </div>
          <div>
            <Label>Nombre Completo</Label>
            <Input
              value={userData.full_name}
              onChange={(e) => setUserData({...userData, full_name: e.target.value})}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div>
            <Label>Teléfono (opcional)</Label>
            <Input
              type="tel"
              value={userData.phone}
              onChange={(e) => setUserData({...userData, phone: e.target.value})}
              placeholder="88887777 o +506 88887777"
            />
          </div>
          <div>
            <Label>Rol</Label>
            <Select value={userData.role} onValueChange={(value: any) => setUserData({...userData, role: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createNewUser} className="w-full">
            Crear Usuario
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
