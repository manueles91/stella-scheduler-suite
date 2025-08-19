import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBookingData } from "@/hooks/useBookingData";
import { ServiceCard } from "@/components/cards/ServiceCard";

export const ServicesSection = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const {
    bookableItems,
    allBookableItems,
    selectedCategory,
    categories,
    formatPrice
  } = useBookingData();

  useEffect(() => {
    if (allBookableItems.length > 0) {
      setLoading(false);
    }
  }, [allBookableItems]);

  // Only show services section when a category is selected
  if (!selectedCategory) {
    return null;
  }

  // Get the category name for display
  const selectedCategoryName = selectedCategory === 'promociones' 
    ? 'Promociones y Ofertas' 
    : categories.find(cat => cat.id === selectedCategory)?.name || 'Categoría';

  if (loading) {
    return (
      <section className="py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif font-bold mb-4">Nuestros Servicios</h2>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-16 sm:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
            {selectedCategoryName}
          </h2>
        </div>

        {/* Services Grid - Only shown when category is selected */}
        {bookableItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {bookableItems.map(service => {
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
                  variablePrice={service.variable_price ?? false}
                  onSelect={() => navigate(`/book?service=${service.id}`)}
                  variant="landing"
                  showExpandable={true}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No se encontraron servicios en esta categoría</p>
          </div>
        )}
      </div>
    </section>
  );
};