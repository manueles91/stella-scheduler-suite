import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
}

interface EmployeeSelectionProps {
  selectedService: any;
  selectedEmployee: Employee | null;
  onEmployeeSelect: (employee: Employee | null) => void;
  onNext: () => void;
  onBack: () => void;
}

export const EmployeeSelection = ({ 
  selectedService, 
  selectedEmployee, 
  onEmployeeSelect, 
  onNext, 
  onBack 
}: EmployeeSelectionProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedService) {
      fetchAvailableEmployees();
    }
  }, [selectedService]);

  const fetchAvailableEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_services')
        .select(`
          employee_id,
          profiles (
            id,
            full_name,
            email,
            role,
            avatar_url
          )
        `)
        .eq('service_id', selectedService.id);

      if (error) {
        console.error('Error fetching employees:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los estilistas",
          variant: "destructive",
        });
        return;
      }

      const employeeProfiles = data
        ?.map(item => item.profiles)
        .filter(Boolean)
        .filter((p: any) => p.role === 'employee' || p.role === 'admin') as Employee[];

      setEmployees(employeeProfiles || []);
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Error al cargar estilistas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando estilistas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Selecciona tu estilista</h2>
        <p className="text-muted-foreground">Elige tu estilista preferido o deja que asignemos automáticamente</p>
      </div>

      <div className="space-y-4">
        {/* Any Available Option */}
        <Card 
          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
            selectedEmployee === null 
              ? 'ring-2 ring-primary bg-primary/5' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => onEmployeeSelect(null)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium">Cualquier estilista disponible</h3>
                <p className="text-sm text-muted-foreground">Asignaremos automáticamente</p>
              </div>
            </div>
            {selectedEmployee === null && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </CardContent>
        </Card>

        {/* Specific Employees */}
        {employees.map((employee) => (
          <Card 
            key={employee.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedEmployee?.id === employee.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onEmployeeSelect(employee)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {employee.avatar_url && (
                    <AvatarImage src={employee.avatar_url} alt={employee.full_name} />
                  )}
                  <AvatarFallback>
                    {employee.full_name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{employee.full_name}</h3>
                  <p className="text-sm text-muted-foreground">Estilista profesional</p>
                </div>
              </div>
              {selectedEmployee?.id === employee.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <Button variant="outline" onClick={onBack}>
          Volver
        </Button>
        <Button onClick={onNext} disabled={selectedEmployee === undefined}>
          Continuar
        </Button>
      </div>
    </div>
  );
};