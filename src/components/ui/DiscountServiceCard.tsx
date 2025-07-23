import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Star, Sparkles, Clock, User, Calendar, Percent, DollarSign, Code, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";

export interface DiscountService {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  duration_minutes?: number;
  price_cents?: number;
}

export interface Discount {
  id: string;
  name: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_public?: boolean;
  discount_code?: string;
  services?: DiscountService;
  service?: DiscountService;
}

export interface Combo {
  id: string;
  name: string;
  description?: string;
  total_price_cents: number;
  original_price_cents: number;
  combo_services: {
    services: {
      name: string;
    };
  }[];
}

export interface DiscountServiceCardProps {
  discount?: Discount;
  combo?: Combo;
  variant?: 'landing' | 'dashboard' | 'admin';
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  className?: string;
  isActive?: boolean;
}

export const DiscountServiceCard = ({
  discount,
  combo,
  variant = 'landing',
  onClick,
  onEdit,
  onDelete,
  canEdit = false,
  className = '',
  isActive = true
}: DiscountServiceCardProps) => {
  // Determine if this is a combo or discount
  const isCombo = !!combo;
  const item = combo || discount;
  
  if (!item) return null;

  // Calculate pricing for discounts
  const service = discount?.services || discount?.service;
  const discountedPrice = discount && service ? (
    discount.discount_type === 'percentage' 
      ? service.price_cents * (1 - discount.discount_value / 100)
      : service.price_cents - (discount.discount_value * 100)
  ) : 0;
  
  const savings = discount && service ? service.price_cents - discountedPrice : 0;
  const discountPercentage = combo ? 
    Math.round((1 - combo.total_price_cents / combo.original_price_cents) * 100) :
    (discount?.discount_type === 'percentage' ? discount.discount_value : 
     Math.round((savings / (service?.price_cents || 1)) * 100));

  const formatPrice = (cents: number) => `₡${Math.round(cents / 100)}`;

  const formatDiscountValue = (value: number, type: string) => {
    return type === 'percentage' ? `${value}%` : `₡${value}`;
  };

  // Check if discount is currently active (for admin view)
  const isDiscountActive = (discount: Discount) => {
    const now = new Date();
    const start = new Date(discount.start_date);
    const end = new Date(discount.end_date);
    return discount.is_active && now >= start && now <= end;
  };

  // Base card classes with 2x height
  const baseCardClasses = `relative overflow-hidden transition-all duration-300 border-primary/20 ${
    variant === 'landing' ? 'hover:shadow-luxury h-96 cursor-pointer' : 
    variant === 'dashboard' ? 'hover:shadow-md h-48' :
    'hover:shadow-md h-52'
  } ${className}`;

  // Render based on variant
  if (variant === 'landing') {
    return (
      <Card className={baseCardClasses} onClick={onClick}>
        {/* Top badge */}
        <div className="absolute top-4 right-4 z-10">
          <Badge className={isCombo ? "bg-gradient-primary text-white" : "bg-red-500 text-white"}>
            {isCombo ? (
              <>
                <Star className="h-3 w-3 mr-1" />
                COMBO
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                {discount?.discount_type === 'percentage' ? `${discount.discount_value}%` : `₡${discount?.discount_value}`} OFF
              </>
            )}
          </Badge>
        </div>
        
        {/* Image */}
        {service?.image_url && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={service.image_url} 
              alt={item.name}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <CardTitle className="font-serif text-xl flex items-center gap-2">
            {isCombo ? (
              <>
                <Package className="h-5 w-5 text-primary" />
                {item.name}
              </>
            ) : (
              item.name
            )}
          </CardTitle>
          {!isCombo && service && (
            <p className="text-sm text-muted-foreground">
              {service.name}
            </p>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description || (isCombo ? "Paquete especial de servicios" : "Descuento especial disponible")}
          </p>
          
          {/* Combo services or service duration */}
          {isCombo && combo ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Incluye:</p>
              <div className="flex flex-wrap gap-1">
                {combo.combo_services.slice(0, 3).map((cs, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cs.services.name}
                  </Badge>
                ))}
                {combo.combo_services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{combo.combo_services.length - 3} más
                  </Badge>
                )}
              </div>
            </div>
          ) : service?.duration_minutes && (
            <div className="flex justify-between items-center">
              <Badge variant="secondary">
                <Clock className="h-3 w-3 mr-1" />
                {service.duration_minutes} min
              </Badge>
            </div>
          )}

          {/* Pricing - pushed to bottom */}
          <div className="mt-auto space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground line-through">
                {isCombo ? formatPrice(combo.original_price_cents) : (service ? formatPrice(service.price_cents) : '')}
              </span>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                Ahorra {isCombo ? formatPrice(combo.original_price_cents - combo.total_price_cents) : formatPrice(savings)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-primary">
                {isCombo ? formatPrice(combo.total_price_cents) : formatPrice(discountedPrice)}
              </span>
              <span className="text-sm font-medium text-green-600">
                {discountPercentage}% OFF
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (variant === 'dashboard') {
    return (
      <div className={`border border-border rounded-lg p-4 space-y-3 bg-gradient-to-r from-primary/5 to-secondary/5 hover:shadow-md transition-shadow h-48 flex flex-col ${className}`}>
        <div className="flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-foreground">{item.name}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {service?.name}
              </div>
              {item.description && (
                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-semibold">
              {discount?.discount_type === 'percentage' ? `${discount.discount_value}% OFF` : `₡${Math.round(discount?.discount_value || 0)} OFF`}
            </Badge>
            {canEdit && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <div className="mt-auto text-xs text-muted-foreground pt-2 border-t border-border/50">
          {discount && (
            <>
              Válida hasta: {new Date(discount.end_date).toLocaleDateString('es-ES', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </>
          )}
        </div>
      </div>
    );
  }
  
  if (variant === 'admin') {
    return (
      <Card className={`transition-shadow hover:shadow-md h-52 flex flex-col ${className}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <Badge variant={isActive ? "default" : "secondary"}>
              {isActive ? "Activo" : "Inactivo"}
            </Badge>
            {discount && !discount.is_public && (
              <Badge variant="outline">
                <Code className="mr-1 h-3 w-3" />
                {discount.discount_code}
              </Badge>
            )}
          </div>
          {canEdit && (
            <div className="flex space-x-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button variant="outline" size="sm" onClick={onDelete}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm flex-1">
            <div>
              <p className="font-medium text-muted-foreground">Servicio</p>
              <p>{service?.name}</p>
            </div>
            <div>
              <p className="font-medium text-muted-foreground">Descuento</p>
              <p className="flex items-center">
                {discount?.discount_type === 'percentage' ? <Percent className="mr-1 h-4 w-4" /> : <DollarSign className="mr-1 h-4 w-4" />}
                {discount && formatDiscountValue(discount.discount_value, discount.discount_type)}
              </p>
            </div>
            {discount && (
              <>
                <div>
                  <p className="font-medium text-muted-foreground">Inicio</p>
                  <p className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {format(new Date(discount.start_date), 'dd/MM/yyyy')}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">Fin</p>
                  <p className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {format(new Date(discount.end_date), 'dd/MM/yyyy')}
                  </p>
                </div>
              </>
            )}
          </div>
          
          {/* Description at bottom if available */}
          {item.description && (
            <div className="mt-auto pt-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return null;
};