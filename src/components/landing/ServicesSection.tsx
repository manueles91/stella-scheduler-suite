import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useBookingData } from "@/hooks/useBookingData";
import { ServiceCard } from "@/components/cards/ServiceCard";
import { CategoryFilter } from "@/components/booking/CategoryFilter";
import { Employee } from "@/types/booking";

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { bookableItems, categories, selectedCategory, setSelectedCategory, formatPrice, employees } = useBookingData();

  useEffect(() => {
    if (bookableItems.length > 0) {
      setLoading(false);
    }
  }, [bookableItems]);

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">Nuestros Servicios</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Descubre nuestra amplia gama de servicios profesionales de belleza
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold mb-4">Nuestros Servicios</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubre nuestra amplia gama de servicios profesionales de belleza
          </p>
        </div>

        {/* Category Filter */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          className="mb-8"
        />

        {/* Services Display - Carousel or Grid based on category selection */}
        {selectedCategory ? (
          // Vertical grid when category is selected
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {bookableItems.map((service) => {
              const comboServices = service.combo_services?.map(cs => ({
                name: cs.services.name,
                quantity: cs.quantity
              })) || [];

              return (
                <ServiceCard
                  key={service.id}
                  id={service.id}
                  name={service.name}
                  description={service.description}
                  originalPrice={service.original_price_cents}
                  finalPrice={service.final_price_cents}
                  savings={service.savings_cents}
                  duration={service.duration_minutes}
                  imageUrl={service.image_url}
                  type={service.type}
                  discountType={service.savings_cents > 0 ? service.appliedDiscount?.discount_type : undefined}
                  discountValue={service.savings_cents > 0 ? service.appliedDiscount?.discount_value : undefined}
                  comboServices={comboServices}
                  onSelect={() => navigate(`/book?service=${service.id}&estilista=cualquier&step=2`)}
                  variant="landing"
                  showExpandable={true}
                />
              );
            })}
          </div>
        ) : (
          // Carousel when all services are shown
          <Carousel className="w-full">
            <CarouselContent className="-ml-2 md:-ml-4">
              {bookableItems.slice(0, 12).map((service) => {
                const comboServices = service.combo_services?.map(cs => ({
                  name: cs.services.name,
                  quantity: cs.quantity
                })) || [];

                return (
                  <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 md:basis-1/2 lg:basis-1/3">
                    <ServiceCard
                      id={service.id}
                      name={service.name}
                      description={service.description}
                      originalPrice={service.original_price_cents}
                      finalPrice={service.final_price_cents}
                      savings={service.savings_cents}
                      duration={service.duration_minutes}
                      imageUrl={service.image_url}
                      type={service.type}
                      discountType={service.savings_cents > 0 ? service.appliedDiscount?.discount_type : undefined}
                      discountValue={service.savings_cents > 0 ? service.appliedDiscount?.discount_value : undefined}
                      comboServices={comboServices}
                      onSelect={() => navigate(`/book?service=${service.id}&estilista=cualquier&step=2`)}
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
        )}

        <div className="text-center mt-8">
          <Button 
            onClick={() => navigate('/book')}
            className="bg-gradient-primary hover:bg-gradient-primary/90"
          >
            Ver todos los servicios
          </Button>
        </div>
      </div>
    </section>
  );
};