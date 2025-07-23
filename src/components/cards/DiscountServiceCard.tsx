import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Clock, 
  Sparkles, 
  Package, 
  ChevronDown, 
  Star,
  DollarSign,
  Percent,
  Tag 
} from "lucide-react";

interface DiscountServiceCardProps {
  // Core data
  id: string;
  name: string;
  description?: string;
  originalPrice: number;
  finalPrice: number;
  savings: number;
  discountType: 'percentage' | 'flat' | 'combo';
  discountValue?: number;
  duration?: number;
  imageUrl?: string;
  
  // Combo specific
  isCombo?: boolean;
  comboServices?: Array<{
    name: string;
    quantity?: number;
  }>;
  
  // Interaction
  onClick?: () => void;
  onEdit?: () => void;
  canEdit?: boolean;
  
  // Display options
  variant?: 'landing' | 'dashboard' | 'admin';
  showExpandable?: boolean;
  className?: string;
}

export const DiscountServiceCard = ({
  id,
  name,
  description,
  originalPrice,
  finalPrice,
  savings,
  discountType,
  discountValue,
  duration,
  imageUrl,
  isCombo = false,
  comboServices = [],
  onClick,
  onEdit,
  canEdit = false,
  variant = 'landing',
  showExpandable = false,
  className = ""
}: DiscountServiceCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatPrice = (priceInCents: number) => {
    return `₡${Math.round(priceInCents / 100)}`;
  };

  const getDiscountPercentage = () => {
    if (originalPrice === 0) return 0;
    return Math.round((savings / originalPrice) * 100);
  };

  const getDiscountBadge = () => {
    if (isCombo) {
      return (
        <Badge className="bg-blue-500 text-white">
          <Package className="h-3 w-3 mr-1" />
          COMBO
        </Badge>
      );
    }
    
    const percentage = getDiscountPercentage();
    return (
      <Badge className="bg-red-500 text-white">
        <Sparkles className="h-3 w-3 mr-1" />
        {discountType === 'percentage' && discountValue 
          ? `${discountValue}%` 
          : `${percentage}%`
        } OFF
      </Badge>
    );
  };

  const CardWrapper = showExpandable ? Collapsible : 'div';
  const cardProps = showExpandable ? { open: isExpanded, onOpenChange: setIsExpanded } : {};

  const cardContent = (
    <Card 
      className={`relative overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/20 cursor-pointer h-64 ${className}`}
      onClick={!showExpandable ? onClick : undefined}
    >
      {/* Discount Badge */}
      <div className="absolute top-4 right-4 z-10">
        {getDiscountBadge()}
      </div>

      {/* Image Section */}
      {imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img 
            src={imageUrl} 
            alt={name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}

      {/* Header */}
      <CardHeader className="pb-2">
        <CardTitle className="font-serif text-lg leading-tight">
          {name}
        </CardTitle>
        {variant === 'dashboard' && duration && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Clock className="h-2 w-2 mr-1" />
              {duration} min
            </Badge>
          </div>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3">
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Combo Services */}
        {isCombo && comboServices.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Incluye:</p>
            <div className="flex flex-wrap gap-1">
              {comboServices.slice(0, 3).map((service, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {service.name}
                  {service.quantity && service.quantity > 1 && ` (x${service.quantity})`}
                </Badge>
              ))}
              {comboServices.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{comboServices.length - 3} más
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Pricing */}
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(originalPrice)}
            </span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              Ahorra {formatPrice(savings)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold text-primary">
              {formatPrice(finalPrice)}
            </span>
            <span className="text-sm font-medium text-green-600">
              {getDiscountPercentage()}% OFF
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {(onClick || onEdit) && (
          <div className="flex gap-2 pt-2">
            {onClick && (
              <Button 
                className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90"
                onClick={onClick}
              >
                {variant === 'admin' ? 'Ver' : 'Reservar'}
              </Button>
            )}
            {canEdit && onEdit && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                Editar
              </Button>
            )}
          </div>
        )}

        {/* Expandable trigger for collapsible version */}
        {showExpandable && (
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-center">
              <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
        )}
      </CardContent>

      {/* Expandable Content */}
      {showExpandable && (
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-3 border-t pt-3">
              {/* Full description in expanded view */}
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
              
              {/* All combo services in expanded view */}
              {isCombo && comboServices.length > 3 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Servicios completos:</p>
                  <div className="grid grid-cols-2 gap-1">
                    {comboServices.map((service, index) => (
                      <Badge key={index} variant="outline" className="text-xs justify-start">
                        {service.name}
                        {service.quantity && service.quantity > 1 && ` (x${service.quantity})`}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      )}
    </Card>
  );

  return showExpandable ? (
    <CardWrapper {...cardProps}>
      {cardContent}
    </CardWrapper>
  ) : (
    cardContent
  );
};