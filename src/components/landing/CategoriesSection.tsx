import { useBookingData } from "@/hooks/useBookingData";
import { CategoryFilter } from "@/components/booking/CategoryFilter";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CategoriesSection = () => {
  const navigate = useNavigate();
  const { categories, selectedCategory, setSelectedCategory } = useBookingData();

  return (
    <section className="py-12 sm:py-16 bg-background border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2">
            Explora nuestras categorías
          </h2>
          <p className="text-muted-foreground mb-6">
            Encuentra el servicio perfecto para ti
          </p>
        </div>

        {/* Enhanced Category Filter with smooth scrolling */}
        <CategoryFilter 
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
          className="mb-6"
        />

        {/* Quick navigation to services */}
        <div className="text-center">
          <Button 
            variant="outline"
            onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
            className="text-sm"
          >
            Ver todos los servicios ↓
          </Button>
        </div>
      </div>
    </section>
  );
};