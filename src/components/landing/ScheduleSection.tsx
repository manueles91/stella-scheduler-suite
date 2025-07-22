import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Phone, Star } from "lucide-react";

export const ScheduleSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-20 px-2 sm:px-4">
      <div className="max-w-full sm:max-w-4xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <Clock className="h-8 w-8 text-primary" />
            Horario de Atención
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground">
            Conoce nuestros horarios y planifica tu visita
          </p>
        </div>
        
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary mb-4">Horarios Regulares</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="font-medium">Lunes - Viernes</span>
                    <span className="text-primary">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="font-medium">Sábados</span>
                    <span className="text-primary">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-muted">
                    <span className="font-medium">Domingos</span>
                    <span className="text-muted-foreground">Cerrado</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-primary mb-4">Información Adicional</h3>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Última cita del día</p>
                      <p className="text-sm">Una hora antes del cierre</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Reservas telefónicas</p>
                      <p className="text-sm">+506 2222-3333</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Star className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium">Feriados</p>
                      <p className="text-sm">Horarios especiales - consultar</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-primary/10 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  ¡Te recomendamos reservar tu cita con anticipación!
                </p>
                <Button 
                  onClick={() => navigate('/book')}
                  className="bg-gradient-primary hover:bg-gradient-primary/90"
                >
                  Reservar ahora
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};