import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-salon.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="relative h-[70vh] sm:h-[80vh] lg:min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      <div className="relative z-10 text-center text-white px-4 sm:px-6 max-w-6xl mx-auto">
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif font-bold leading-tight">
            Tu belleza, nuestra
            <span className="block text-primary-glow">pasión</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-white/90 max-w-3xl mx-auto leading-relaxed">
            Experimenta tratamientos de belleza personalizados con los mejores profesionales. 
            Tu transformación comienza aquí.
          </p>
          
          {/* Primary CTA */}
          <div className="space-y-3 sm:space-y-4">
            <Button 
              size="lg" 
              className="text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-6 h-auto bg-primary hover:bg-primary/90 shadow-elegant transition-all duration-300 hover:scale-105" 
              onClick={() => navigate('/book')}
            >
              Reserva tu cita ahora
            </Button>
            
            {/* Secondary actions */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center items-center">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-sm sm:text-base px-6 sm:px-8 py-3 sm:py-4 h-auto bg-white/10 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm" 
                onClick={() => navigate('/auth')}
              >
                Crear cuenta
              </Button>
              <span className="text-white/60 hidden sm:block">o</span>
              <button 
                className="text-white/80 hover:text-white underline underline-offset-4 transition-colors"
                onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Ver nuestros servicios
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};