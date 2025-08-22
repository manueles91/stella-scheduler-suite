import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Import all service images
import alisadoOrganico from "@/assets/services/alisado-organico.jpg";
import balayage from "@/assets/services/balayage.jpg";
import banoColorTratamiento from "@/assets/services/bano-color-tratamiento.jpg";
import bioplastia from "@/assets/services/bioplastia.jpg";
import botoxCapilar from "@/assets/services/botox-capilar.jpg";
import corteHombreBarba from "@/assets/services/corte-hombre-barba.jpg";
import corteMujerBlower from "@/assets/services/corte-mujer-blower.jpg";
import disenoCejas from "@/assets/services/diseno-cejas.jpg";
import esmaltadoGel from "@/assets/services/esmaltado-gel.jpg";
import exfoliacionCorporal from "@/assets/services/exfoliacion-corporal.jpg";
import gelXApres from "@/assets/services/gel-x-apres.jpg";
import henna from "@/assets/services/henna.jpg";
import highlights from "@/assets/services/highlights.jpg";
import laminado from "@/assets/services/laminado.jpg";
import liftingTintura from "@/assets/services/lifting-tintura.jpg";
import limpiezaFacialHidratante from "@/assets/services/limpieza-facial-hidratante.jpg";
import limpiezaFacialRelajante from "@/assets/services/limpieza-facial-relajante.jpg";
import limpiezaFacialAcne from "@/assets/services/limpieza-facial-acne.jpg";
import limpiezaFacialPremium from "@/assets/services/limpieza-facial-premium.jpg";
import limpiezaFacialProfunda from "@/assets/services/limpieza-facial-profunda.jpg";
import limpiezaFacialCaballero from "@/assets/services/limpieza-facial-caballero.jpg";
import limpiezaFacialProfundaHidratante from "@/assets/services/limpieza-facial-profunda-hidratante.jpg";
import manicuraAcrilico from "@/assets/services/manicura-acrilico.jpg";
import manicuraCaballero from "@/assets/services/manicura-caballero.jpg";
import manicuraLuminary from "@/assets/services/manicura-luminary.jpg";
import manicuraRegular from "@/assets/services/manicura-regular.jpg";
import manicuraSpa from "@/assets/services/manicura-spa.jpg";
import masajeDescontracturante from "@/assets/services/masaje-descontracturante.jpg";
import masajeDrenajeLinfatico from "@/assets/services/masaje-drenaje-linfatico.jpg";
import masajePiedrasCalientes from "@/assets/services/masaje-piedras-calientes.jpg";
import masajeRelajante from "@/assets/services/masaje-relajante.jpg";
import masajeSuecoRelajante from "@/assets/services/masaje-sueco-relajante.jpg";
import pedicura from "@/assets/services/pedicura.jpg";
import pedicuraCaballero from "@/assets/services/pedicura-caballero.jpg";
import pedicuraSpa from "@/assets/services/pedicura-spa.jpg";
import peinadoLavado from "@/assets/services/peinado-lavado.jpg";
import peinadoSinLavado from "@/assets/services/peinado-sin-lavado.jpg";
import tratamientoAntiEdad from "@/assets/services/tratamiento-anti-edad.jpg";
import tratamientoHidratante from "@/assets/services/tratamiento-hidratante.jpg";
import tratamientoPoros from "@/assets/services/tratamiento-poros.jpg";
import tratamientoKeratina from "@/assets/services/tratamiento-keratina.jpg";
import tratamientoVitaminaC from "@/assets/services/tratamiento-vitamina-c.jpg";
import tratamientoBrasileno from "@/assets/services/tratamiento-brasileño.jpg";
import colorTouch from "@/assets/services/color-touch.jpg";
import tinturaCejas from "@/assets/services/tintura-cejas.jpg";
import tinturaPestanas from "@/assets/services/tintura-pestanas.jpg";
import extensionesPestanas from "@/assets/services/extensiones-pestanas.jpg";

export interface ServiceImageMapping {
  serviceName: string;
  imageUrl: string;
  fileName: string;
}

// Mapping of service names to their placeholder images
export const serviceImageMappings: ServiceImageMapping[] = [
  { serviceName: "Alisado Orgánico", imageUrl: alisadoOrganico, fileName: "alisado-organico.jpg" },
  { serviceName: "Balayage", imageUrl: balayage, fileName: "balayage.jpg" },
  { serviceName: "Baño de Color con Tratamiento", imageUrl: banoColorTratamiento, fileName: "bano-color-tratamiento.jpg" },
  { serviceName: "Bioplastia", imageUrl: bioplastia, fileName: "bioplastia.jpg" },
  { serviceName: "Botox Capilar", imageUrl: botoxCapilar, fileName: "botox-capilar.jpg" },
  { serviceName: "Corte Hombre & Perfilado de Barba", imageUrl: corteHombreBarba, fileName: "corte-hombre-barba.jpg" },
  { serviceName: "Corte Mujer & Blower", imageUrl: corteMujerBlower, fileName: "corte-mujer-blower.jpg" },
  { serviceName: "Diseño de Cejas", imageUrl: disenoCejas, fileName: "diseno-cejas.jpg" },
  { serviceName: "Esmaltado en Gel", imageUrl: esmaltadoGel, fileName: "esmaltado-gel.jpg" },
  { serviceName: "Exfoliación Corporal", imageUrl: exfoliacionCorporal, fileName: "exfoliacion-corporal.jpg" },
  { serviceName: "Gel X Après", imageUrl: gelXApres, fileName: "gel-x-apres.jpg" },
  { serviceName: "Henna", imageUrl: henna, fileName: "henna.jpg" },
  { serviceName: "Highlights", imageUrl: highlights, fileName: "highlights.jpg" },
  { serviceName: "Laminado", imageUrl: laminado, fileName: "laminado.jpg" },
  { serviceName: "Lifting y Tintura", imageUrl: liftingTintura, fileName: "lifting-tintura.jpg" },
  { serviceName: "Limpieza Facial Básica Hidratante", imageUrl: limpiezaFacialHidratante, fileName: "limpieza-facial-hidratante.jpg" },
  { serviceName: "Limpieza Facial Básica Relajante", imageUrl: limpiezaFacialRelajante, fileName: "limpieza-facial-relajante.jpg" },
  { serviceName: "Limpieza Facial para Acné", imageUrl: limpiezaFacialAcne, fileName: "limpieza-facial-acne.jpg" },
  { serviceName: "Limpieza Facial Premium", imageUrl: limpiezaFacialPremium, fileName: "limpieza-facial-premium.jpg" },
  { serviceName: "Limpieza Facial Profunda", imageUrl: limpiezaFacialProfunda, fileName: "limpieza-facial-profunda.jpg" },
  { serviceName: "Limpieza Facial Profunda Caballero", imageUrl: limpiezaFacialCaballero, fileName: "limpieza-facial-caballero.jpg" },
  { serviceName: "Limpieza Facial Profunda Hidratante", imageUrl: limpiezaFacialProfundaHidratante, fileName: "limpieza-facial-profunda-hidratante.jpg" },
  { serviceName: "Manicura Acrílico", imageUrl: manicuraAcrilico, fileName: "manicura-acrilico.jpg" },
  { serviceName: "Manicura Caballero", imageUrl: manicuraCaballero, fileName: "manicura-caballero.jpg" },
  { serviceName: "Manicura Luminary", imageUrl: manicuraLuminary, fileName: "manicura-luminary.jpg" },
  { serviceName: "Manicura Regular", imageUrl: manicuraRegular, fileName: "manicura-regular.jpg" },
  { serviceName: "Manicura Spa", imageUrl: manicuraSpa, fileName: "manicura-spa.jpg" },
  { serviceName: "Masaje Descontracturante", imageUrl: masajeDescontracturante, fileName: "masaje-descontracturante.jpg" },
  { serviceName: "Masaje Drenaje Linfático", imageUrl: masajeDrenajeLinfatico, fileName: "masaje-drenaje-linfatico.jpg" },
  { serviceName: "Masaje Piedras Calientes", imageUrl: masajePiedrasCalientes, fileName: "masaje-piedras-calientes.jpg" },
  { serviceName: "Masaje Relajante", imageUrl: masajeRelajante, fileName: "masaje-relajante.jpg" },
  { serviceName: "Masaje Sueco Relajante", imageUrl: masajeSuecoRelajante, fileName: "masaje-sueco-relajante.jpg" },
  { serviceName: "Pedicura", imageUrl: pedicura, fileName: "pedicura.jpg" },
  { serviceName: "Pedicura Caballero", imageUrl: pedicuraCaballero, fileName: "pedicura-caballero.jpg" },
  { serviceName: "Pedicura Spa", imageUrl: pedicuraSpa, fileName: "pedicura-spa.jpg" },
  { serviceName: "Peinado con Lavado", imageUrl: peinadoLavado, fileName: "peinado-lavado.jpg" },
  { serviceName: "Peinado sin Lavado", imageUrl: peinadoSinLavado, fileName: "peinado-sin-lavado.jpg" },
  { serviceName: "Tratamiento Anti-edad", imageUrl: tratamientoAntiEdad, fileName: "tratamiento-anti-edad.jpg" },
  { serviceName: "Tratamiento Hidratante", imageUrl: tratamientoHidratante, fileName: "tratamiento-hidratante.jpg" },
  { serviceName: "Tratamiento de Poros", imageUrl: tratamientoPoros, fileName: "tratamiento-poros.jpg" },
  { serviceName: "Tratamiento de Keratina", imageUrl: tratamientoKeratina, fileName: "tratamiento-keratina.jpg" },
  { serviceName: "Tratamiento Vitamina C", imageUrl: tratamientoVitaminaC, fileName: "tratamiento-vitamina-c.jpg" },
  { serviceName: "Tratamiento Brasileño", imageUrl: tratamientoBrasileno, fileName: "tratamiento-brasileño.jpg" },
  { serviceName: "Color Touch", imageUrl: colorTouch, fileName: "color-touch.jpg" },
  { serviceName: "Tintura de Cejas", imageUrl: tinturaCejas, fileName: "tintura-cejas.jpg" },
  { serviceName: "Tintura de Pestañas", imageUrl: tinturaPestanas, fileName: "tintura-pestanas.jpg" },
  { serviceName: "Extensiones de Pestañas", imageUrl: extensionesPestanas, fileName: "extensiones-pestanas.jpg" },
];

async function convertImageToFile(imageUrl: string, fileName: string): Promise<File> {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new File([blob], fileName, { type: blob.type });
}

export async function uploadServiceImages(): Promise<void> {
  console.log("Starting service image upload process...");
  
  try {
    for (const mapping of serviceImageMappings) {
      try {
        // Convert image to file
        const file = await convertImageToFile(mapping.imageUrl, mapping.fileName);
        
        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(`services/${mapping.fileName}`, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) {
          console.error(`Error uploading ${mapping.fileName}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(`services/${mapping.fileName}`);

        // Update database
        const { error: updateError } = await supabase
          .from('services')
          .update({ image_url: publicUrl })
          .eq('name', mapping.serviceName);

        if (updateError) {
          console.error(`Error updating service ${mapping.serviceName}:`, updateError);
        } else {
          console.log(`✓ Updated ${mapping.serviceName} with image`);
        }

      } catch (error) {
        console.error(`Error processing ${mapping.serviceName}:`, error);
      }
    }
    
    toast.success("Service images uploaded successfully!");
    console.log("Service image upload process completed");
  } catch (error) {
    console.error("Error in upload process:", error);
    toast.error("Error uploading service images");
  }
}