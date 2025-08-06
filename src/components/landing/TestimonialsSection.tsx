import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "María González",
    service: "Facial completo",
    rating: 5,
    comment: "Increíble experiencia. Mi piel nunca se había visto tan radiante. El personal es muy profesional y atento.",
    avatar: "👩🏻"
  },
  {
    name: "Ana Rodríguez", 
    service: "Manicura y pedicura",
    rating: 5,
    comment: "Siempre salgo perfecta. La atención al detalle es excepcional y el ambiente es muy relajante.",
    avatar: "👩🏽"
  },
  {
    name: "Carmen López",
    service: "Masaje relajante",
    rating: 5,
    comment: "El mejor lugar para desconectar del estrés. Los masajes son simplemente perfectos.",
    avatar: "👩🏻‍🦰"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-16 sm:py-24 bg-muted/20">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-4 sm:mb-6">
            Lo que dicen nuestras clientas
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
            La satisfacción de nuestras clientas es nuestra mayor recompensa
          </p>
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
                  "{testimonial.comment}"
                </p>
                
                <div className="flex items-center gap-3 pt-4">
                  <div className="text-2xl">{testimonial.avatar}</div>
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