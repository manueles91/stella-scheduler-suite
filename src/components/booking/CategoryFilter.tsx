import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryImage } from "@/components/landing/CategoryImages";
import { Sparkles } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

interface CategoryFilterProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

export const CategoryFilter = ({
  categories,
  selectedCategory,
  onCategorySelect,
  className = ""
}: CategoryFilterProps) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Categorías de Servicios</h3>
      </div>
      
      <Carousel className="w-full" opts={{
        align: "start",
        loop: false,
        dragFree: true,
        skipSnaps: false
      }}>
        <CarouselContent className="-ml-2 md:-ml-4">
          {/* Promociones Card - Selected by default */}
          <CarouselItem className="pl-2 md:pl-4 basis-[120px] sm:basis-[140px] md:basis-[160px]">
            <Card 
              className={`h-20 sm:h-24 md:h-28 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-105 ${
                selectedCategory === 'promociones' 
                  ? 'ring-2 ring-primary shadow-lg bg-primary/10' 
                  : 'hover:shadow-md'
              }`} 
              onClick={() => onCategorySelect('promociones')}
            >
              <div className="h-full w-full bg-gradient-to-br from-yellow-400/20 to-orange-500/10 flex items-center justify-center">
                <div className="text-center">
                  <Sparkles className="h-4 w-4 md:h-5 md:w-5 mx-auto mb-1 text-yellow-600" />
                  <div className="text-[9px] md:text-xs font-medium text-foreground">Promociones</div>
                  <div className="text-[8px] md:text-xs text-muted-foreground">y ofertas</div>
                </div>
              </div>
            </Card>
          </CarouselItem>

          {/* Category Cards */}
          {categories.map(category => (
            <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-[120px] sm:basis-[140px] md:basis-[160px]">
              <Card 
                className={`h-20 sm:h-24 md:h-28 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-105 ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-primary shadow-lg' 
                    : 'hover:shadow-md'
                }`} 
                onClick={() => onCategorySelect(category.id)}
              >
                {/* Background Image or Gradient - Use the same system as landing page */}
                <div className="absolute inset-0">
                  {(() => {
                    const imageUrl = getCategoryImage(category.name);
                    return imageUrl ? (
                      <img 
                        src={imageUrl} 
                        alt={category.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-secondary/5" />
                    );
                  })()}
                  {/* Enhanced overlay for better text readability - Stronger gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content - Moved to bottom with better shadow */}
                <div className="relative z-10 h-full flex items-end justify-center p-1 md:p-2">
                  <div className="text-center">
                    <div className="text-[9px] md:text-xs font-medium text-white drop-shadow-2xl">
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedCategory === category.id && (
                  <Badge className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-[8px] md:text-xs h-3 md:h-4 bg-primary">
                    ✓
                  </Badge>
                )}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};