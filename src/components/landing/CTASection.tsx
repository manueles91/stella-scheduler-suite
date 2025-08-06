import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const CTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 sm:py-24 bg-gradient-primary text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary-glow to-primary opacity-90"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-4xl mx-auto text-center px-4 sm:px-6">
        <div className="space-y-6 sm:space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold leading-tight">
            ¿Lista para tu 
            <span className="block">transformación?</span>
          </h2>
          <p className="text-lg sm:text-xl mb-8 text-white/90 max-w-2xl mx-auto leading-relaxed">
            Únete a miles de clientes satisfechas que han confiado en nosotros para realzar su belleza natural.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-12 py-6 h-auto bg-white text-primary hover:bg-white/90 shadow-lg transition-all duration-300 hover:scale-105"
              onClick={() => navigate('/book')}
            >
              Reservar mi cita
            </Button>
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 h-auto bg-white/20 hover:bg-white/30 border border-white/30 backdrop-blur-sm"
              onClick={() => navigate('/auth')}
            >
              Crear cuenta
            </Button>
          </div>
          
          {/* Trust indicators */}
          <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center items-center text-white/80">
            <div className="flex items-center gap-2">
              <span className="text-lg">⭐⭐⭐⭐⭐</span>
              <span className="text-sm">+500 clientes satisfechas</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-white/30"></div>
            <div className="text-sm">
              📱 Reserva fácil y rápida
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};