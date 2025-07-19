import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-salon.jpg";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-serif">Cargando...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
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
            <Button size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6" onClick={() => navigate('/auth')}>
              Iniciar sesión / Registrarse
            </Button>
            <Button variant="outline" size="lg" className="text-base sm:text-lg px-4 sm:px-8 py-3 sm:py-6 bg-white/10 border-white text-white hover:bg-white hover:text-foreground">
              Más información
            </Button>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-10 sm:py-20 px-2 sm:px-4">
        <div className="max-w-full sm:max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold mb-2 sm:mb-4">Nuestros servicios</h2>
            <p className="text-base sm:text-xl text-muted-foreground">Déjate consentir con nuestros tratamientos exclusivos</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {[
              { name: "Signature Facial", duration: "90 min", price: "₡150", description: "Premium anti-aging treatment" },
              { name: "Hair Cut & Style", duration: "60 min", price: "₡85", description: "Professional styling service" },
              { name: "Massage Therapy", duration: "90 min", price: "₡120", description: "Relaxing full-body massage" },
              { name: "Manicure", duration: "45 min", price: "₡65", description: "Classic nail care service" },
              { name: "Hair Color", duration: "180 min", price: "₡180", description: "Expert color consultation" },
              { name: "Makeup Application", duration: "45 min", price: "₡80", description: "Professional event makeup" },
            ].map((service, index) => (
              <Card key={index} className="hover:shadow-luxury transition-all duration-300">
                <CardHeader>
                  <CardTitle className="font-serif">{service.name}</CardTitle>
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary">{service.duration}</Badge>
                    <span className="text-lg font-bold text-primary">{service.price}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{service.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
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
            onClick={() => navigate('/auth')}
          >
            Reservar ahora
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
