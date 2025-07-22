import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price_cents: number;
  image_url?: string;
}

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  useEffect(() => {
    fetchActiveServices();
  }, []);

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) {
      return;
    }

    const timer = setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [api, current]);

  const fetchActiveServices = async () => {
    try {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, description, duration_minutes, price_cents, image_url, is_active")
        .eq("is_active", true)
        .limit(12);
      
      if (error) {
        console.error("Supabase error fetching services:", error);
        setFetchError("Error loading services");
        return;
      }
      
      setServices(data || []);
    } catch (error) {
      console.error("Error fetching services:", error);
      setFetchError("Error loading services");
    }
  };

  return (
    <section className="py-10 sm:py-20 px-2 sm:px-4">
      <div className="max-w-full sm:max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4">Nuestros servicios</h2>
          <p className="text-base sm:text-xl text-muted-foreground">Déjate consentir con nuestros tratamientos exclusivos</p>
        </div>
        
        <div className="relative px-12">
          <Carousel
            setApi={setApi}
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
                    <Card 
                      className="hover:shadow-luxury transition-all duration-300 h-full overflow-hidden cursor-pointer"
                      onClick={() => navigate('/book')}
                    >
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
                        <Button className="w-full mt-4" variant="outline">
                          Reservar ahora
                        </Button>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))
              ) : (
                // Fallback hardcoded services with images
                fallbackServices.map((service, index) => (
                  <CarouselItem key={index} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <Card 
                      className="hover:shadow-luxury transition-all duration-300 h-full overflow-hidden cursor-pointer"
                      onClick={() => navigate('/book')}
                    >
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
                        <Button className="w-full mt-4" variant="outline">
                          Reservar ahora
                        </Button>
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
  );
};