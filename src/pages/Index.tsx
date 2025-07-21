import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Star, Sparkles, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import heroImage from "@/assets/hero-salon.jpg";

interface Combo {
  id: string;
  name: string;
  description: string;
  total_price_cents: number;
  original_price_cents: number;
  start_date?: string;
  end_date?: string;
  combo_services: {
    services: {
      name: string;
    };
  }[];
}

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date?: string;
  end_date?: string;
  services: {
    name: string;
  };
}

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    } else if (!loading && !user) {
      fetchActivePromotions();
    }
  }, [user, loading, navigate]);

  // Auto-scroll carousel effect
  useEffect(() => {
    if (!api) {
      return;
    }

    const interval = setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 4000);

    return () => clearTimeout(interval);
  }, [api, current]);

  const fetchActivePromotions = async () => {
    try {
      const now = new Date();
      
      // Fetch active combos - simplified query without date filtering first
      const { data: combosData, error: combosError } = await supabase
        .from("combos")
        .select(`
          id,
          name,
          description,
          total_price_cents,
          original_price_cents,
          start_date,
          end_date,
          combo_services (
            services (
              name
            )
          )
        `)
        .eq("is_active", true);
      
      if (combosError) {
        console.error("Error fetching combos:", combosError);
      } else {
        console.log("All combos:", combosData);
        // Filter by date in JavaScript for now
        const filteredCombos = combosData?.filter(combo => {
          const startDate = new Date(combo.start_date || '2020-01-01');
          const endDate = new Date(combo.end_date || '2030-12-31');
          return now >= startDate && now <= endDate;
        }) || [];
        console.log("Filtered combos:", filteredCombos);
        setCombos(filteredCombos);
      }

      // Fetch active public discounts
      const { data: discountsData, error: discountsError } = await supabase
        .from("discounts")
        .select(`
          id,
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          services (
            name
          )
        `)
        .eq("is_active", true)
        .eq("is_public", true);
      
      if (discountsError) {
        console.error("Error fetching discounts:", discountsError);
      } else {
        console.log("All discounts:", discountsData);
        // Filter by date in JavaScript for now
        const filteredDiscounts = discountsData?.filter(discount => {
          const startDate = new Date(discount.start_date || '2020-01-01');
          const endDate = new Date(discount.end_date || '2030-12-31');
          return now >= startDate && now <= endDate;
        }) || [];
        console.log("Filtered discounts:", filteredDiscounts);
        setDiscounts(filteredDiscounts);
      }
    } catch (error) {
      console.error("Error fetching promotions:", error);
    }
  };

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
            <Button size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6" onClick={() => navigate('/auth')}>
              Iniciar sesión / Registrarse
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              Más información
            </Button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-10 sm:py-20 px-2 sm:px-4">
        <div className="max-w-full sm:max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4">Nuestros servicios</h2>
            <p className="text-base sm:text-xl text-muted-foreground">Déjate consentir con nuestros tratamientos exclusivos</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[
              { name: "Signature Facial", duration: "90 min", price: "₡150", description: "Premium anti-aging treatment" },
              { name: "Hair Cut & Style", duration: "60 min", price: "₡85", description: "Professional styling service" },
              { name: "Massage Therapy", duration: "90 min", price: "₡120", description: "Relaxing full-body massage" },
              { name: "Manicure", duration: "45 min", price: "₡65", description: "Classic nail care service" },
              { name: "Hair Color", duration: "180 min", price: "₡180", description: "Expert color consultation" },
              { name: "Makeup Application", duration: "45 min", price: "₡80", description: "Professional event makeup" },
            ].map((service, index) => (
              <Card key={index} className="hover:shadow-luxury transition-all duration-300">
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
            ))}
          </div>
        </div>
      </section>

      {/* Promociones Section */}
      {(combos.length > 0 || discounts.length > 0) && (
        <section className="py-10 sm:py-20 bg-muted/50 px-2 sm:px-4">
          <div className="max-w-full sm:max-w-6xl mx-auto">
            <div className="text-center mb-8 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
                <Sparkles className="h-8 w-8 text-primary" />
                Promociones
              </h2>
              <p className="text-base sm:text-xl text-muted-foreground">
                Descubre nuestras ofertas especiales y combos exclusivos
              </p>
            </div>
            
            <Carousel 
              setApi={setApi}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {/* Combos */}
                {combos.map((combo) => (
                  <CarouselItem key={`combo-${combo.id}`} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="relative overflow-hidden hover:shadow-luxury transition-all duration-300 border-primary/20 h-full">
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-primary text-white">
                          <Package className="h-3 w-3 mr-1" />
                          COMBO
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          {combo.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {combo.description || "Paquete especial de servicios"}
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Incluye:</p>
                          <div className="flex flex-wrap gap-1">
                            {combo.combo_services.slice(0, 2).map((cs, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cs.services.name}
                              </Badge>
                            ))}
                            {combo.combo_services.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{combo.combo_services.length - 2} más
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

                {/* Discounts */}
                {discounts.map((discount) => (
                  <CarouselItem key={`discount-${discount.id}`} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <Card className="relative overflow-hidden hover:shadow-luxury transition-all duration-300 border-primary/20 h-full">
                      <div className="absolute top-4 right-4 z-10">
                        <Badge className="bg-gradient-primary text-white">
                          <Percent className="h-3 w-3 mr-1" />
                          {discount.discount_type === 'percentage' ? `${discount.discount_value}% OFF` : `₡${discount.discount_value} OFF`}
                        </Badge>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          {discount.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {discount.description || "Oferta especial limitada"}
                        </p>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Aplicable a:</p>
                          <Badge variant="outline" className="text-xs">
                            {discount.services.name}
                          </Badge>
                        </div>

                        <div className="pt-2">
                          <p className="text-lg font-bold text-primary">
                            {discount.discount_type === 'percentage' 
                              ? `${discount.discount_value}% de descuento` 
                              : `₡${discount.discount_value} de descuento`
                            }
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="text-center mt-8">
              <Button 
                onClick={() => navigate('/auth')}
                className="bg-gradient-primary hover:bg-gradient-primary/90"
              >
                Ver todas las promociones
              </Button>
            </div>
          </div>
        </section>
      )}

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
            onClick={() => navigate('/auth')}
          >
            Reservar ahora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
