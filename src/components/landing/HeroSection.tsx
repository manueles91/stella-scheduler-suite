import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-salon.jpg";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: `url(${heroImage})` }}
    >
      <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      <div className="relative z-10 text-center text-white px-2 sm:px-4 max-w-full sm:max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-serif font-bold mb-4 sm:mb-6">
          ¡Bienvenido a Stella Studio!
        </h1>
        <p className="text-base sm:text-xl md:text-2xl mb-4 sm:mb-8 text-white/90">
          Disfruta de nuestros tratamientos exclusivos y reserva tu cita hoy mismo.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-center">
          <Button size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6" onClick={() => navigate('/book')}>
            Reserva tu cita
          </Button>
          <Button size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-primary hover:bg-primary/90" onClick={() => navigate('/auth')}>
            Ingresar / Registrarte
          </Button>
          <Button variant="outline" size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
            Más información
          </Button>
        </div>
      </div>
    </section>
  );
};