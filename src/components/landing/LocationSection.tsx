import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Clock } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export const LocationSection = () => {
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  // Function to get ordered business hours
  const getOrderedBusinessHours = () => {
    const dayOrder = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    
    if (settings?.business_hours) {
      return dayOrder.map(day => {
        const hours = settings.business_hours[day];
        return { day, hours };
      }).filter(({ hours }) => hours !== undefined);
    }
    
    // Default hours in proper order
    return [
      { day: 'lunes', hours: '9:00 AM - 7:00 PM' },
      { day: 'martes', hours: '9:00 AM - 7:00 PM' },
      { day: 'miércoles', hours: '9:00 AM - 7:00 PM' },
      { day: 'jueves', hours: '9:00 AM - 7:00 PM' },
      { day: 'viernes', hours: '9:00 AM - 7:00 PM' },
      { day: 'sábado', hours: '9:00 AM - 5:00 PM' },
      { day: 'domingo', hours: 'Cerrado' }
    ];
  };

  // Generate Google Maps static image URL
  const getMapImageUrl = () => {
    const address = settings?.business_address || 'Av. Central 123, San José, Costa Rica';
    const encodedAddress = encodeURIComponent(address);
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=15&size=600x400&maptype=roadmap&markers=color:red%7C${encodedAddress}&key=YOUR_API_KEY`;
  };

  return (
    <section className="py-10 sm:py-20 bg-muted/30 px-2 sm:px-4">
      <div className="max-w-full sm:max-w-6xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <MapPin className="h-8 w-8 text-primary" />
            Nuestra Ubicación
          </h2>
        </div>
        
        {/* Interactive Map - Directly under title */}
        <div className="mb-12">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-muted-foreground/20 relative group">
            {/* Static Map Image */}
            <div className="w-full h-full bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center relative">
              <MapPin className="h-16 w-16 text-red-500 absolute z-10 animate-pulse" />
              <div className="absolute inset-0 bg-muted/20"></div>
            </div>
            
            {/* Overlay with click action */}
            <a 
              href={settings?.google_maps_link || 'https://maps.google.com'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
            >
              <div className="bg-white/90 rounded-lg p-4 text-center">
                <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-primary font-medium text-sm">Ver en Google Maps</p>
                <p className="text-xs text-muted-foreground">Haz clic para abrir</p>
              </div>
            </a>
          </div>
        </div>

        {/* Location Info - Below the map */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Address */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Dirección</h3>
                  <p className="text-muted-foreground">
                    {settings?.business_address || 'Av. Central 123, San José, Costa Rica, 10101'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Phone */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Reservas telefónicas</h3>
                  <p className="text-muted-foreground">
                    {settings?.business_phone || '+506 2222-3333'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Horarios de Atención</h3>
                  <div className="text-muted-foreground space-y-1">
                    {getOrderedBusinessHours().map(({ day, hours }) => (
                      <p key={day} className="capitalize">
                        {day}: {hours}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mt-8">
          <Button 
            size="lg" 
            className="bg-gradient-primary hover:bg-gradient-primary/90"
            onClick={() => navigate('/book')}
          >
            Reservar tu cita
          </Button>
        </div>
      </div>
    </section>
  );
};