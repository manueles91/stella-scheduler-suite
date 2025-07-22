import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-10 sm:py-20 bg-gradient-primary text-white">
      <div className="max-w-full sm:max-w-4xl mx-auto text-center px-2 sm:px-4">
        <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-4 sm:mb-6">¿Listo para tu transformación?</h2>
        <p className="text-base sm:text-xl mb-4 sm:mb-8 text-white/90">
          Reserva tu cita y vive la experiencia Stella Studio.
        </p>
        <Button 
          size="lg" 
          variant="outline" 
          className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white text-primary hover:bg-white/90"
          onClick={() => navigate('/book')}
        >
          Reservar ahora
        </Button>
      </div>
    </section>
  );
};