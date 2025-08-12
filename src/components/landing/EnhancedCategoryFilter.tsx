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
        <CarouselContent className="ml-0">
          {/* Category Cards - Mobile Responsive Sizing */}
          {categories.map(category => (
            <CarouselItem 
              key={category.id} 
              className="pl-1.5 sm:pl-2 basis-[110px] sm:basis-[120px] md:basis-[140px] lg:basis-[160px] xl:basis-[180px]"
            >
              <Card 
                className={`h-18 sm:h-20 md:h-24 lg:h-28 xl:h-32 cursor-pointer transition-all duration-300 relative overflow-hidden group hover:scale-105 min-h-[72px] sm:min-h-[80px] md:min-h-[96px] ${
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
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
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

                {/* Content - Mobile Responsive */}
                <div className="relative z-10 h-full flex items-end justify-center p-1 sm:p-1.5 md:p-2 lg:p-3">
                  <div className="text-center">
                    <div className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base font-bold text-white drop-shadow-lg leading-tight px-1">
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Selected Indicator - Mobile Responsive */}
                {selectedCategory === category.id && (
                  <Badge className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[7px] sm:text-[8px] md:text-[9px] h-3 sm:h-3.5 md:h-4 bg-white text-primary">
                    ✓
                  </Badge>
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
      
      {/* Mobile Scroll Indicator */}
      <div className="flex justify-center mt-2 sm:mt-3 md:hidden">
        <div className="flex space-x-1.5">
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
          <div className="w-2 h-2 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
