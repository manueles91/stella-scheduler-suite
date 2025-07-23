import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useBookingData } from "@/hooks/useBookingData";
import { ServiceCard } from "@/components/booking/ServiceCard";
import { Employee } from "@/types/booking";

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const { bookableItems, formatPrice, employees } = useBookingData();

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

        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {bookableItems.map((service) => (
              <CarouselItem key={service.id} className="pl-2 md:pl-4 basis-full sm:basis-1/2 lg:basis-1/3">
                <ServiceCard
                  service={service}
                  isSelected={false}
                  onSelect={() => navigate(`/book?service=${service.id}&estilista=cualquier&step=2`)}
                  employees={employees}
                  selectedEmployee={null}
                  onEmployeeSelect={() => {}}
                  allowEmployeeSelection={false}
                  formatPrice={formatPrice}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

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