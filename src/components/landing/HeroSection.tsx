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
      
      {/* Hero Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-start px-4 sm:px-6 pt-16 sm:pt-24">
        <div className="text-center text-white max-w-6xl mx-auto">
          <div className="space-y-6 sm:space-y-8">
            {settings?.logo_url && (
              <div className="flex justify-center">
                <img
                  src={settings.logo_url}
                  alt="Logo del salón Stella Studio"
                  className="h-16 sm:h-20 md:h-24 w-auto object-contain drop-shadow"
                />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold leading-tight">
              Tu belleza, nuestra
              <span className="block text-primary-glow">pasión</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Experimenta tratamientos de belleza personalizados con los mejores profesionales. 
              Tu transformación comienza aquí.
            </p>
            
            {/* Primary CTA */}
            <div className="space-y-3 sm:space-y-4">
              <Button 
                size="lg" 
                className="text-base sm:text-lg px-8 sm:px-12 py-3 sm:py-4 h-auto bg-primary hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-105" 
                onClick={() => navigate('/book')}
              >
                Reserva tu cita ahora
              </Button>
              {/* Secondary actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-sm px-6 py-2 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" 
                  onClick={() => navigate('/auth')}
                >
                  Ingresar
                </Button>
              </div>
            </div>

            {/* Spotlight: Categorías */}
            <div className="mt-6 sm:mt-8">
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
                  ¿Qué buscas hoy?
                </h2>
                <p className="text-sm sm:text-base text-white/80">
                  Explora nuestras categorías y encuentra el servicio perfecto para ti
                </p>
              </div>
              <div className="container mx-auto px-4 sm:px-6">
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

      {/* Categorías integradas arriba en el hero */}
    </section>
  );
};