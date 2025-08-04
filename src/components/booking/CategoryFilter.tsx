import { useState } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  return <div className={`w-full ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Categorías de Servicios</h3>
        
      </div>
      
      <Carousel className="w-full">
        <CarouselContent className="-ml-1 md:-ml-2">
          {/* All Services Card */}
          <CarouselItem className="pl-1 md:pl-2 basis-[80px] md:basis-[120px]">
            <Card className={`h-16 md:h-20 cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedCategory === null ? 'ring-2 ring-primary shadow-lg bg-primary/10' : 'hover:shadow-md'}`} onClick={() => onCategorySelect(null)}>
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-[10px] md:text-xs font-medium text-foreground">Todos</div>
                  <div className="text-[9px] md:text-xs text-muted-foreground">servicios</div>
                </div>
              </div>
            </Card>
          </CarouselItem>

          {/* Category Cards */}
          {categories.map(category => <CarouselItem key={category.id} className="pl-1 md:pl-2 basis-[80px] md:basis-[120px]">
              <Card className={`h-16 md:h-20 cursor-pointer transition-all duration-300 relative overflow-hidden ${selectedCategory === category.id ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`} onClick={() => onCategorySelect(category.id)}>
                {/* Background Image or Gradient */}
                <div className="absolute inset-0">
                  {category.image_url ? <img src={category.image_url} alt={category.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-secondary/20 to-secondary/5" />}
                  {/* Overlay for text readability */}
                  <div className="absolute inset-0 bg-black/30" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-center justify-center p-1 md:p-2">
                  <div className="text-center">
                    <div className="text-[10px] md:text-xs font-medium text-white drop-shadow-md">
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedCategory === category.id && <Badge className="absolute top-0.5 right-0.5 md:top-1 md:right-1 text-[9px] md:text-xs h-4 md:h-5 bg-primary">
                    ✓
                  </Badge>}
              </Card>
            </CarouselItem>)}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>;
};