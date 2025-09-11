import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { useBookingData } from "@/hooks/useBookingData";
import { EnhancedCategoryFilter } from "@/components/landing/EnhancedCategoryFilter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImage from "@/assets/hero-salon.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { categories, selectedCategory, setSelectedCategory } = useBookingData();
  const { settings, isLoading } = useSiteSettings();

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    // Auto-scroll to services section
    setTimeout(() => {
      document.getElementById('services')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  return (
    <section 
      className="relative min-h-screen flex flex-col overflow-x-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${settings?.landing_background_url || heroImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-hero opacity-85"></div>
      
      {/* Hero Content - Mobile First Design with Generous Spacing */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 lg:pt-10 xl:pt-12 pb-16 sm:pb-20 md:pb-24 lg:pb-32">
        <div className="text-center text-white max-w-6xl mx-auto w-full">
          {/* Logo - Fixed size across all screen sizes */}
          {settings?.logo_url && (
            <div className="flex justify-center mb-6 sm:mb-8 md:mb-10">
              <img
                src={settings.logo_url}
                alt="Logo del salón Stella Studio"
                className="w-auto h-[280px] object-contain drop-shadow"
              />
            </div>
          )}
          
          <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12">
            {/* Main Heading - Dynamic from Site Settings */}
            {isLoading ? (
              <div className="px-8 sm:px-16 md:px-24 lg:px-32 mx-auto w-full max-w-3xl">
                <Skeleton className="h-8 sm:h-10 md:h-12 w-full bg-white/20" />
              </div>
            ) : (
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-serif font-bold leading-tight px-1 sm:px-2 md:px-4">
                {settings?.hero_title || ''}
              </h1>
            )}

            {/* Mission blurb - Dynamic from Site Settings */}
            <div className="px-4 sm:px-6 md:px-8">
              {isLoading ? (
                <div className="mx-auto w-full max-w-3xl space-y-2">
                  <Skeleton className="h-4 w-11/12 bg-white/15" />
                  <Skeleton className="h-4 w-10/12 bg-white/15" />
                </div>
              ) : (
                <p className="mt-3 sm:mt-4 md:mt-5 text-white/90 text-sm sm:text-base md:text-lg leading-relaxed max-w-3xl mx-auto">
                  {settings?.hero_subtitle || ''}
                </p>
              )}
            </div>
            
            {/* CTA Buttons - Mobile Responsive Layout */}
            <div className="space-y-3 sm:space-y-4 md:space-y-5 px-3 sm:px-4 md:px-6">
              {/* Primary Button */}
              <Button 
                size="lg" 
                className="text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 h-auto bg-primary hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-105 min-h-[44px] sm:min-h-[48px] md:min-h-[52px]" 
                onClick={() => navigate('/book')}
              >
                Reserva tu cita
              </Button>
              
              {/* Secondary Button */}
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm min-h-[40px] sm:min-h-[44px]" 
                  onClick={() => navigate('/auth')}
                >
                  Ingresar
                </Button>
              </div>
            </div>

            {/* Categories Section - Mobile Responsive with Adjusted Spacing */}
            <div className="mt-12 sm:mt-20 md:mt-28 lg:mt-36 mb-8 sm:mb-12 md:mb-16 lg:mb-20 px-1 sm:px-2 md:px-4">
              <div className="text-center mb-4 sm:mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif font-bold text-white mb-2 sm:mb-3">
                  ¿Qué buscas hoy?
                </h2>
              </div>
              
              {/* Category Filter Container */}
              <div className="w-full max-w-full px-1 sm:px-2 md:px-4 lg:px-6 overflow-x-hidden">
                <EnhancedCategoryFilter 
                  categories={categories} 
                  selectedCategory={selectedCategory} 
                  onCategorySelect={handleCategorySelect} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};