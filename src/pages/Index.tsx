import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/landing/HeroSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { PromocionesSection } from "@/components/landing/PromocionesSection";
import { LocationSection } from "@/components/landing/LocationSection";
import { ScheduleSection } from "@/components/landing/ScheduleSection";
import { CTASection } from "@/components/landing/CTASection";

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
      <HeroSection />

      {/* Services Section - Now First */}
      <ServicesSection />

      {/* Promociones Section - Now Second */}
      <PromocionesSection />

      {/* Map Location Section */}
      <LocationSection />

      {/* Horario Section */}
      <ScheduleSection />

      {/* CTA Section */}
      <CTASection />
    </div>
  );
};

export default Index;