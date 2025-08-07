// Import all category images
import cejas from "@/assets/categories/cejas.jpg";
import faciales from "@/assets/categories/faciales.jpg";
import manicura from "@/assets/categories/manicura.jpg";
import masajes from "@/assets/categories/masajes.jpg";
import pedicura from "@/assets/categories/pedicura.jpg";
import pestanas from "@/assets/categories/pestanas.jpg";
import relajantes from "@/assets/categories/relajantes.jpg";
import tratamientos from "@/assets/categories/tratamientos.jpg";

export const categoryImages: Record<string, string> = {
  'cejas': cejas,
  'faciales': faciales,
  'manicura': manicura,
  'masajes': masajes,
  'pedicura': pedicura,
  'pestañas': pestanas,
  'relajantes': relajantes,
  'tratamientos': tratamientos,
};

export const getCategoryImage = (categoryName: string): string | null => {
  const normalizedName = categoryName.toLowerCase();
  return categoryImages[normalizedName] || null;
};