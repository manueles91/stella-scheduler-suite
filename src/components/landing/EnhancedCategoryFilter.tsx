import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryImage } from "./CategoryImages";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

interface EnhancedCategoryFilterProps {
  categories: ServiceCategory[];
  selectedCategory: string | null;
  onCategorySelect: (categoryId: string | null) => void;
  className?: string;
}

export const EnhancedCategoryFilter = ({
  categories,
  selectedCategory,
  onCategorySelect,
  className = ""
}: EnhancedCategoryFilterProps) => {
  const [api, setApi] = useState<any>(null);

  // Auto-scroll effect for infinite carousel
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      api.scrollNext();
    }, 3000); // Scroll every 3 seconds for slow movement

    return () => clearInterval(interval);
  }, [api]);

  return (
    <div className={`w-full overflow-x-hidden ${className}`}>
      <Carousel 
        className="w-full overflow-x-clip" 
        setApi={setApi}
        opts={{
          align: "start",
          loop: true, // Enable infinite loop
          dragFree: true,
          skipSnaps: false
        }}
      >
        <CarouselContent className="ml-0">
          {/* Category Cards - Mobile Responsive Sizing */}
          {categories.map(category => (
            <CarouselItem 
              key={category.id} 
              className="pl-1.5 sm:pl-2 basis-[132px] sm:basis-[144px] md:basis-[168px] lg:basis-[192px] xl:basis-[216px]"
            >
              <Card 
                className={`h-[108px] sm:h-[120px] md:h-[144px] lg:h-[168px] xl:h-[192px] cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-105 ${
                  selectedCategory === category.id 
                    ? 'ring-3 ring-white ring-offset-2 ring-offset-background shadow-2xl' 
                    : 'hover:shadow-xl border-white/30 hover:scale-105'
                }`} 
                onClick={() => onCategorySelect(category.id)}
              >
                {/* Background Image or Gradient */}
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
                      <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-secondary/10" />
                    );
                  })()}
                  
                  {/* Selected state overlay */}
                  {selectedCategory === category.id && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-white/10 rounded-lg" />
                  )}
                  
                  {/* Enhanced overlay for better readability - Stronger gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content - Mobile Responsive - Positioned at bottom with absolute positioning */}
                <div className="absolute bottom-0 left-0 right-0 z-10 p-1 sm:p-1.5 md:p-2 lg:p-3">
                  <div className="text-center w-full">
                    <div className={`text-[11px] sm:text-[12px] md:text-sm lg:text-base xl:text-lg font-bold text-white drop-shadow-2xl leading-tight px-1 transition-all duration-300 ${
                      selectedCategory === category.id ? 'text-primary-foreground font-semibold' : ''
                    }`}>
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Enhanced selected indicator */}
                {selectedCategory === category.id && (
                  <div className="absolute top-1 right-1 sm:top-2 sm:right-2 md:top-3 md:right-3">
                    <div className="bg-white text-primary rounded-full p-1 sm:p-1.5 md:p-2 shadow-xl">
                      <Check className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    </div>
                  </div>
                )}

                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Navigation Arrows - Mobile Responsive */}
        <CarouselPrevious className="hidden sm:flex -left-6 sm:-left-8 md:-left-12 bg-white/20 border-white/30 text-white hover:bg-white/30 h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
        <CarouselNext className="hidden sm:flex -right-6 sm:-right-8 md:-right-12 bg-white/20 border-white/30 text-white hover:bg-white/30 h-7 w-7 sm:h-8 sm:w-8 md:h-10 md:w-10" />
      </Carousel>
    </div>
  );
};
