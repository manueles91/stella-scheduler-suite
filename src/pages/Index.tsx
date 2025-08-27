import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HeroSection } from "@/components/landing/HeroSection";
import { CategoriesSection } from "@/components/landing/CategoriesSection";
import { ServicesSection } from "@/components/landing/ServicesSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { LocationSection } from "@/components/landing/LocationSection";
import { CTASection } from "@/components/landing/CTASection";
import { BookingProvider } from "@/contexts/BookingContext";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";

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
    <BookingProvider>
      <div className="min-h-screen bg-background">
        {/* Hero Section with Integrated Categories */}
        <HeroSection />

        {/* Services Section - Filtered by categories */}
        <ServicesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* Map Location Section */}
        <LocationSection />

        {/* Final CTA Section */}
        <CTASection />

        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
      </div>
    </BookingProvider>
  );
};

export default Index;