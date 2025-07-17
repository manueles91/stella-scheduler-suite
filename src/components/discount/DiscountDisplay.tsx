import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Percent, DollarSign, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Discount {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_public: boolean;
  discount_code: string | null;
  is_active: boolean;
}

interface DiscountDisplayProps {
  serviceId: string;
  originalPrice: number;
  onDiscountApplied?: (discount: Discount | null, finalPrice: number) => void;
  className?: string;
}

const DiscountDisplay: React.FC<DiscountDisplayProps> = ({
  serviceId,
  originalPrice,
  onDiscountApplied,
  className = "",
}) => {
  const [publicDiscounts, setPublicDiscounts] = useState<Discount[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState<Discount | null>(null);
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicDiscounts();
  }, [serviceId]);

  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    onDiscountApplied?.(appliedDiscount, finalPrice);
  }, [appliedDiscount, originalPrice]);

  const fetchPublicDiscounts = async () => {
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("service_id", serviceId)
        .eq("is_public", true)
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString());

      if (error) throw error;
      
      // Auto-apply the best public discount
      if (data && data.length > 0) {
        const bestDiscount = findBestDiscount(data);
        setAppliedDiscount(bestDiscount);
      }
      
      setPublicDiscounts(data || []);
    } catch (error) {
      console.error("Error fetching discounts:", error);
    }
  };

  const findBestDiscount = (discounts: Discount[]): Discount => {
    return discounts.reduce((best, current) => {
      const bestSavings = calculateSavings(best, originalPrice);
      const currentSavings = calculateSavings(current, originalPrice);
      return currentSavings > bestSavings ? current : best;
    });
  };

  const calculateSavings = (discount: Discount, price: number): number => {
    if (discount.discount_type === 'percentage') {
      return (price * discount.discount_value) / 100;
    }
    return Math.min(discount.discount_value, price);
  };

  const calculateFinalPrice = (): number => {
    if (!appliedDiscount) return originalPrice;
    
    const savings = calculateSavings(appliedDiscount, originalPrice);
    return Math.max(0, originalPrice - savings);
  };

  const applyDiscountCode = async () => {
    if (!discountCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código de descuento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("discounts")
        .select("*")
        .eq("service_id", serviceId)
        .eq("discount_code", discountCode.toUpperCase())
        .eq("is_active", true)
        .lte("start_date", new Date().toISOString())
        .gte("end_date", new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "Código inválido",
            description: "El código de descuento no existe o ha expirado",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      // Check if this discount is better than current
      const currentSavings = appliedDiscount ? calculateSavings(appliedDiscount, originalPrice) : 0;
      const newSavings = calculateSavings(data, originalPrice);

      if (newSavings > currentSavings) {
        setAppliedDiscount(data);
        toast({
          title: "¡Código aplicado!",
          description: `Descuento "${data.name}" aplicado correctamente`,
        });
      } else {
        toast({
          title: "Código válido",
          description: "Ya tienes un descuento mejor aplicado",
        });
      }
    } catch (error) {
      console.error("Error applying discount code:", error);
      toast({
        title: "Error",
        description: "Error al aplicar el código de descuento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const removeDiscount = () => {
    setAppliedDiscount(null);
    setDiscountCode("");
    // Reapply best public discount if available
    if (publicDiscounts.length > 0) {
      const bestPublic = findBestDiscount(publicDiscounts);
      setAppliedDiscount(bestPublic);
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `$${(priceInCents / 100).toFixed(2)}`;
  };

  const finalPrice = calculateFinalPrice();
  const savings = appliedDiscount ? calculateSavings(appliedDiscount, originalPrice) : 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Applied Discount Display */}
      {appliedDiscount && (
        <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Badge variant="default" className="bg-green-600">
                {appliedDiscount.discount_type === 'percentage' ? (
                  <Percent className="mr-1 h-3 w-3" />
                ) : (
                  <DollarSign className="mr-1 h-3 w-3" />
                )}
                {appliedDiscount.name}
              </Badge>
              {!appliedDiscount.is_public && (
                <Badge variant="outline">
                  <Tag className="mr-1 h-3 w-3" />
                  {appliedDiscount.discount_code}
                </Badge>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={removeDiscount}>
              Quitar
            </Button>
          </div>
          
          <div className="text-sm text-green-700 dark:text-green-300">
            {appliedDiscount.description}
          </div>
          
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(originalPrice)}
              </span>
              <span className="ml-2 text-lg font-semibold text-green-600">
                {formatPrice(finalPrice)}
              </span>
            </div>
            <div className="text-sm font-medium text-green-600">
              Ahorras {formatPrice(savings)}
            </div>
          </div>
        </div>
      )}

      {/* Discount Code Input */}
      <div className="flex space-x-2">
        <Input
          placeholder="Código de descuento"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => e.key === 'Enter' && applyDiscountCode()}
        />
        <Button 
          onClick={applyDiscountCode} 
          disabled={loading}
          variant="outline"
        >
          {loading ? "Aplicando..." : "Aplicar"}
        </Button>
      </div>

      {/* Price Display */}
      {!appliedDiscount && (
        <div className="text-right">
          <span className="text-lg font-semibold">
            {formatPrice(originalPrice)}
          </span>
        </div>
      )}
    </div>
  );
};

export default DiscountDisplay;