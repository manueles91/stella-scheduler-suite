import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const defaultTestimonials = [
  {
    id: 1,
    name: "María González",
    service: "Facial completo",
    rating: 5,
    text: "Increíble experiencia. Mi piel nunca se había visto tan radiante. El personal es muy profesional y atento.",
  },
  {
    id: 2,
    name: "Ana Rodríguez", 
    service: "Manicura y pedicura",
    rating: 5,
    text: "Siempre salgo perfecta. La atención al detalle es excepcional y el ambiente es muy relajante.",
  },
  {
    id: 3,
    name: "Carmen López",
    service: "Masaje relajante",
    rating: 5,
    text: "El mejor lugar para desconectar del estrés. Los masajes son simplemente perfectos.",
  }
];

export const TestimonialsSection = () => {
  const { settings } = useSiteSettings();
  
  const testimonials = settings?.testimonials && settings.testimonials.length > 0 
    ? settings.testimonials 
    : defaultTestimonials;

  return (
    <section className="py-16 sm:py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 sm:mb-6">
            Lo que dicen nuestras clientas
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="bg-card hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-6 sm:p-8 space-y-4">
                <div className="flex items-center gap-2">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <p className="text-muted-foreground italic leading-relaxed">
                  "{testimonial.text}"
                </p>
                
                <div className="flex items-center gap-3 pt-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-primary font-semibold text-sm">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.service}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};