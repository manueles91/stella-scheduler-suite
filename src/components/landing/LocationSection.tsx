import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock } from "lucide-react";

export const LocationSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-20 bg-muted/30 px-2 sm:px-4">
      <div className="max-w-full sm:max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Nuestra Ubicación
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground">
            Visítanos en nuestro elegante salón
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Map Placeholder */}
          <div className="aspect-video bg-muted rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Mapa interactivo</p>
              <p className="text-sm text-muted-foreground">Se agregará próximamente</p>
            </div>
          </div>
          
          {/* Location Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Dirección</h3>
                      <p className="text-muted-foreground">
                        Av. Central 123, San José<br />
                        Costa Rica, 10101
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Teléfono</h3>
                      <p className="text-muted-foreground">+506 2222-3333</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-1" />
                    <div>
                      <h3 className="font-semibold mb-1">Horarios</h3>
                      <div className="text-muted-foreground space-y-1">
                        <p>Lunes - Viernes: 9:00 AM - 7:00 PM</p>
                        <p>Sábados: 9:00 AM - 5:00 PM</p>
                        <p>Domingos: Cerrado</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Button 
              size="lg" 
              className="w-full bg-gradient-primary hover:bg-gradient-primary/90"
              onClick={() => navigate('/book')}
            >
              Reservar tu cita
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};