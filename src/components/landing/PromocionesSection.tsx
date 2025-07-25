import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { StandardServiceCard } from "@/components/cards/StandardServiceCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

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

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  services: {
    id: string;
    name: string;
    description: string;
    duration_minutes: number;
    price_cents: number;
    image_url?: string;
  };
}

export const PromocionesSection = () => {
  const navigate = useNavigate();
  const [combos, setCombos] = useState<Combo[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    fetchActiveCombos();
    fetchActiveDiscounts();
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

  const fetchActiveDiscounts = async () => {
    try {
      setFetchError(null);
      const now = new Date();
      const nowISO = now.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      const { data, error } = await supabase
        .from("discounts")
        .select(`
          id,
          name,
          description,
          discount_type,
          discount_value,
          start_date,
          end_date,
          is_active,
          services (
            id,
            name,
            description,
            duration_minutes,
            price_cents,
            image_url
          )
        `)
        .eq("is_active", true)
        .eq("is_public", true)
        .lte("start_date", nowISO)
        .gte("end_date", nowISO)
        .limit(10);
      
      if (error) {
        console.error("Supabase error fetching discounts:", error);
        setFetchError("Error loading discounts");
        return;
      }
      
      setDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      setFetchError("Error loading discounts");
    }
  };

  return (
    <section className="py-10 sm:py-20 bg-muted/50 px-2 sm:px-4">
      <div className="max-w-full sm:max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-16">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            Promociones
          </h2>
          <p className="text-base sm:text-xl text-muted-foreground">
            Aprovecha nuestros paquetes exclusivos y descuentos especiales
          </p>
        </div>
        
        {/* Show combos, individual discounts, and discounted services */}
        {(combos.length > 0 || discounts.length > 0) ? (
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
                {/* Show combos first */}
                {combos.map((combo) => (
                  <CarouselItem key={`combo-${combo.id}`} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                    <StandardServiceCard
                      id={combo.id}
                      name={combo.name}
                      description={combo.description || "Paquete especial de servicios"}
                      originalPrice={combo.original_price_cents}
                      finalPrice={combo.total_price_cents}
                      savings={combo.original_price_cents - combo.total_price_cents}
                      type="combo"
                      discountType="combo"
                      comboServices={combo.combo_services.map(cs => ({
                        name: cs.services.name,
                        quantity: 1
                      }))}
                      onSelect={() => navigate('/book')}
                      variant="landing"
                      showExpandable={true}
                    />
                  </CarouselItem>
                ))}
                
                {/* Show individual discounts */}
                {discounts.map((discount) => {
                  const discountedPrice = discount.discount_type === 'percentage' 
                    ? discount.services.price_cents * (1 - discount.discount_value / 100)
                    : discount.services.price_cents - (discount.discount_value * 100);
                  const savings = discount.services.price_cents - discountedPrice;
                  
                  return (
                    <CarouselItem key={`discount-${discount.id}`} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                      <StandardServiceCard
                        id={discount.id}
                        name={discount.name}
                        description={discount.description || discount.services.description || "Descuento especial disponible"}
                        originalPrice={discount.services.price_cents}
                        finalPrice={discountedPrice}
                        savings={savings}
                        type="discount"
                        discountType={discount.discount_type}
                        discountValue={discount.discount_value}
                        duration={discount.services.duration_minutes}
                        imageUrl={discount.services.image_url}
                        onSelect={() => navigate(`/book?service=${discount.services.id}&step=2&estilista=cualquier&discount=${discount.id}`)}
                        variant="landing"
                        showExpandable={true}
                      />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay promociones disponibles en este momento</p>
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
  );
};