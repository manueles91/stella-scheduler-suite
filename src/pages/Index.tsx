import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Sparkles, MapPin, Phone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import heroImage from "@/assets/hero-salon.jpg";

interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
  combo_services: {
    services: {
      name: string;
    };
  }[];
}

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url?: string;
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    } else if (!loading && !user) {
      fetchActiveCombos();
      fetchActiveServices();
    }
  }, [user, loading, navigate]);

  const fetchActiveCombos = async () => {
    try {
      setFetchError(null);
      const now = new Date();
      const nowISO = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from("combos")
        .select(`
          id,
          name,
          description,
          total_price_cents,
          original_price_cents,
          combo_services (
            services (
              name
            )
          )
        `)
        .eq("is_active", true)
        .lte("start_date", nowISO)
        .gte("end_date", nowISO)
        .limit(10);
      
      if (error) {
        console.error("Supabase error fetching combos:", error);
        setFetchError("Error loading combos");
        return;
      }
      
      setCombos(data || []);
    } catch (error) {
      console.error("Error fetching combos:", error);
      setFetchError("Error loading combos");
    }
  };

  const fetchActiveServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, duration_minutes, price_cents, image_url")
        .eq("is_active", true)
        .limit(12);
      
      if (error) {
        console.error("Supabase error fetching services:", error);
        return;
      }
      
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
    }
  };

  // Fallback services with images
  const fallbackServices = [
    { 
      name: "Signature Facial", 
      duration: "90 min", 
      price: "₡150", 
      description: "Premium anti-aging treatment",
      image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=250&fit=crop"
    },
    { 
      name: "Hair Cut & Style", 
      duration: "60 min", 
      price: "₡85", 
      description: "Professional styling service",
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=250&fit=crop"
    },
    { 
      name: "Massage Therapy", 
      duration: "90 min", 
      price: "₡120", 
      description: "Relaxing full-body massage",
      image: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=250&fit=crop"
    },
    { 
      name: "Manicure", 
      duration: "45 min", 
      price: "₡65", 
      description: "Classic nail care service",
      image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&h=250&fit=crop"
    },
    { 
      name: "Hair Color", 
      duration: "180 min", 
      price: "₡180", 
      description: "Expert color consultation",
      image: "https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=400&h=250&fit=crop"
    },
    { 
      name: "Makeup Application", 
      duration: "45 min", 
      price: "₡80", 
      description: "Professional event makeup",
      image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&h=250&fit=crop"
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif">Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
        <div className="relative z-10 text-center text-white px-2 sm:px-4 max-w-full sm:max-w-4xl mx-auto">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-bold mb-4 sm:mb-6">
            ¡Bienvenido a Stella Studio!
          </h1>
          <p className="text-base sm:text-xl md:text-2xl mb-4 sm:mb-8 text-white/90">
            Disfruta de nuestros tratamientos exclusivos y reserva tu cita hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
            <Button size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6" onClick={() => navigate('/book')}>
              Reserva tu cita
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              Más información
            </Button>
          </div>
        </div>
      </section>

      {/* Combos Section - Now First */}
      <section className="py-10 sm:py-20 bg-muted/50 px-2 sm:px-4">
        <div className="max-w-full sm:max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
              <Sparkles className="h-8 w-8 text-primary" />
              Combos Especiales
            </h2>
            <p className="text-base sm:text-xl text-muted-foreground">
              Aprovecha nuestros paquetes exclusivos con precios especiales
            </p>
          </div>
          
          {combos.length > 0 ? (
            <div className="relative px-12">
              <Carousel
                opts={{
                  align: "start",
                  loop: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-2 md:-ml-4">
                  {combos.map((combo) => (
                    <CarouselItem key={combo.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Card className="relative overflow-hidden hover:shadow-luxury transition-all duration-300 border-primary/20 h-full">
                        <div className="absolute top-4 right-4 z-10">
                          <Badge className="bg-gradient-primary text-white">
                            <Star className="h-3 w-3 mr-1" />
                            COMBO
                          </Badge>
                        </div>
                        <CardHeader className="pb-2">
                          <CardTitle className="font-serif text-xl flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            {combo.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {combo.description || "Paquete especial de servicios"}
                          </p>
                          
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Incluye:</p>
                            <div className="flex flex-wrap gap-1">
                              {combo.combo_services.slice(0, 3).map((cs, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cs.services.name}
                                </Badge>
                              ))}
                              {combo.combo_services.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{combo.combo_services.length - 3} más
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground line-through">
                                ₡{Math.round(combo.original_price_cents / 100)}
                              </span>
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                Ahorra ₡{Math.round((combo.original_price_cents - combo.total_price_cents) / 100)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-bold text-primary">
                                ₡{Math.round(combo.total_price_cents / 100)}
                              </span>
                              <span className="text-sm font-medium text-green-600">
                                {Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100)}% OFF
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
              </Carousel>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No hay combos disponibles en este momento</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate('/book')}
              className="bg-gradient-primary hover:bg-gradient-primary/90"
            >
              Reservar ahora
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section - Now Second with Carousel */}
      <section className="py-10 sm:py-20 px-2 sm:px-4">
        <div className="max-w-full sm:max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4">Nuestros servicios</h2>
            <p className="text-base sm:text-xl text-muted-foreground">Déjate consentir con nuestros tratamientos exclusivos</p>
          </div>
          
          <div className="relative px-12">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {services.length > 0 ? (
                  services.map((service) => (
                    <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Card className="hover:shadow-luxury transition-all duration-300 h-full overflow-hidden">
                        {service.image_url && (
                          <div className="aspect-video overflow-hidden">
                            <img 
                              src={service.image_url} 
                              alt={service.name}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        )}
                        <CardHeader>
                          <CardTitle className="font-serif">{service.name}</CardTitle>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{service.duration_minutes} min</Badge>
                            <span className="text-lg font-bold text-primary">₡{Math.round(service.price_cents / 100)}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{service.description || "Servicio profesional disponible"}</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))
                ) : (
                  // Fallback hardcoded services with images
                  fallbackServices.map((service, index) => (
                    <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <Card className="hover:shadow-luxury transition-all duration-300 h-full overflow-hidden">
                        <div className="aspect-video overflow-hidden">
                          <img 
                            src={service.image} 
                            alt={service.name}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <CardHeader>
                          <CardTitle className="font-serif">{service.name}</CardTitle>
                          <div className="flex justify-between items-center">
                            <Badge variant="secondary">{service.duration}</Badge>
                            <span className="text-lg font-bold text-primary">{service.price}</span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{service.description}</p>
                        </CardContent>
                      </Card>
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Map Location Section */}
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

      {/* CTA Section */}
      <section className="py-10 sm:py-20 bg-gradient-primary text-white">
        <div className="max-w-full sm:max-w-4xl mx-auto text-center px-2 sm:px-4">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-4 sm:mb-6">¿Listo para tu transformación?</h2>
          <p className="text-base sm:text-xl mb-4 sm:mb-8 text-white/90">
            Reserva tu cita y vive la experiencia Stella Studio.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white text-primary hover:bg-white/90"
            onClick={() => navigate('/book')}
          >
            Reservar ahora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
