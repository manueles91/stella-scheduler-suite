// Import all category images
import cejas from "@/assets/categories/cejas.jpg";
import cabello from "@/assets/categories/cabello.jpg";
import manicuraYPedicura from "@/assets/categories/manicura-y-pedicura.jpg";
import esteticaFacial from "@/assets/categories/estetica-facial.jpg";
import esteticaCorporal from "@/assets/categories/estetica-corporal.jpg";
import pestanas from "@/assets/categories/pestanas.jpg";

export const categoryImages: Record<string, string> = {
  'cejas': cejas,
  'cabello': cabello,
  'manicura y pedicura': manicuraYPedicura,
  'estética facial': esteticaFacial,
  'estética corporal': esteticaCorporal,
  'pestañas': pestanas,
};

export const getCategoryImage = (categoryName: string): string | null => {
  const normalizedName = categoryName.toLowerCase();
  return categoryImages[normalizedName] || null;
};