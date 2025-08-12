import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useBookingData } from "@/hooks/useBookingData";
import { EnhancedCategoryFilter } from "@/components/landing/EnhancedCategoryFilter";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import heroImage from "@/assets/hero-salon.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();
  const { categories, selectedCategory, setSelectedCategory } = useBookingData();
  const { settings } = useSiteSettings();

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
      
      {/* Hero Content - Mobile First Design */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-3 sm:px-4 md:px-6 lg:px-8 pt-6 sm:pt-8 md:pt-16 lg:pt-20 xl:pt-24">
        <div className="text-center text-white max-w-6xl mx-auto w-full">
          <div className="space-y-3 sm:space-y-4 md:space-y-6 lg:space-y-8">
            {/* Logo - Mobile Responsive */}
            {settings?.logo_url && (
              <div className="flex justify-center mb-3 sm:mb-4 md:mb-6">
                <img
                  src={settings.logo_url}
                  alt="Logo del salón Stella Studio"
                  className="h-10 w-auto object-contain drop-shadow sm:h-12 md:h-16 lg:h-20 xl:h-24"
                />
              </div>
            )}
            
            {/* Main Heading - Mobile Responsive Typography */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-serif font-bold leading-tight px-1 sm:px-2 md:px-4">
              <span className="block">Tu belleza, nuestra</span>
              <span className="block text-primary-glow mt-1 sm:mt-2">pasión</span>
            </h1>
            
            {/* Description - Mobile Responsive */}
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-white/90 max-w-[280px] sm:max-w-xs md:max-w-sm lg:max-w-2xl xl:max-w-3xl mx-auto leading-relaxed px-3 sm:px-4 md:px-6">
              Experimenta tratamientos de belleza personalizados con los mejores profesionales. 
              Tu transformación comienza aquí.
            </p>
            
            {/* CTA Buttons - Mobile Responsive Layout */}
            <div className="space-y-2.5 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6">
              {/* Primary Button */}
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-5 sm:px-6 md:px-8 lg:px-12 py-2.5 sm:py-3 md:py-4 h-auto bg-primary hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-105 max-w-[280px] sm:max-w-xs md:max-w-none mx-auto min-h-[44px] sm:min-h-[48px] md:min-h-[52px]" 
                onClick={() => navigate('/book')}
              >
                Reserva tu cita ahora
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

            {/* Categories Section - Mobile Responsive */}
            <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 px-1 sm:px-2 md:px-4">
              <div className="text-center mb-3 sm:mb-4 md:mb-6">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-serif font-bold text-white mb-1.5 sm:mb-2">
                  ¿Qué buscas hoy?
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-white/80 px-3 sm:px-4 md:px-6 max-w-[280px] sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto">
                  Explora nuestras categorías y encuentra el servicio perfecto para ti
                </p>
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