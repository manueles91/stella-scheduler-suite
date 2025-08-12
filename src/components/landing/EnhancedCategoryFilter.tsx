import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryImage } from "./CategoryImages";

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
  return (
    <div className={`w-full overflow-x-hidden ${className}`}>
      <Carousel 
        className="w-full overflow-x-clip" 
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
          skipSnaps: false
        }}
      >
        <CarouselContent className="ml-0 md:-ml-4">
          {/* Category Cards (no "Todos" option displayed) */}
          {categories.map(category => (
            <CarouselItem key={category.id} className="pl-2 md:pl-4 basis-[140px] sm:basis-[160px] md:basis-[180px]">
              <Card 
                className={`h-24 sm:h-28 md:h-32 cursor-pointer transition-all duration-300 relative overflow-hidden group sm:hover:scale-105 ${
                  selectedCategory === category.id 
                    ? 'ring-2 ring-white shadow-2xl' 
                    : 'hover:shadow-xl border-white/30'
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
                        className="w-full h-full object-cover sm:group-hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-secondary/10" />
                    );
                  })()}
                  {/* Enhanced overlay for better readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/10" />
                  {/* Hover glow effect */}
                  <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex items-end justify-center p-2 md:p-3">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm md:text-base font-bold text-white drop-shadow-lg">
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Selected Indicator */}
                {selectedCategory === category.id && (
                  <Badge className="absolute top-1 right-1 text-[9px] h-4 bg-white text-primary">
                    ✓
                  </Badge>
                )}

                {/* Shine effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12 -translate-x-full sm:group-hover:translate-x-full transition-transform duration-700" />
                </div>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex -left-12 bg-white/20 border-white/30 text-white hover:bg-white/30" />
        <CarouselNext className="hidden sm:flex -right-12 bg-white/20 border-white/30 text-white hover:bg-white/30" />
      </Carousel>
    </div>
  );
};
