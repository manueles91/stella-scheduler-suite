import { useMemo } from 'react';
import { useServices } from './useServices';
import { useCombos } from './useCombos';
import { useDiscounts } from './useDiscounts';
import { BookableItem, Service, Combo, Discount } from '@/types/booking';

export const useBookableItems = (selectedCategory?: string | null) => {
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useServices();
  const { data: combos = [], isLoading: combosLoading, error: combosError } = useCombos();
  const { data: discounts = [], isLoading: discountsLoading, error: discountsError } = useDiscounts();

  const { allItems, filteredItems } = useMemo(() => {
    const processedItems = processBookableItems(services, combos, discounts);
    
    const filtered = selectedCategory 
      ? processedItems.filter(item => {
          if (item.type === 'service') {
            return item.category_id === selectedCategory;
          } else if (item.type === 'combo' && item.combo_services) {
            const serviceIds = item.combo_services.map(cs => cs.service_id);
            return services.some(service => 
              serviceIds.includes(service.id) && service.category_id === selectedCategory
            );
          }
          return false;
        })
      : processedItems;

    return {
      allItems: processedItems,
      filteredItems: filtered
    };
  }, [services, combos, discounts, selectedCategory]);

  const isLoading = servicesLoading || combosLoading || discountsLoading;
  const error = servicesError || combosError || discountsError;

  return {
    data: filteredItems,
    allItems,
    isLoading,
    error
  };
};

const processBookableItems = (
  services: Service[], 
  combos: Combo[], 
  discounts: Discount[]
): BookableItem[] => {
  const items: BookableItem[] = [];

  // Process services with discounts
  services.forEach(service => {
    const serviceDiscounts = discounts.filter(d => d.service_id === service.id);
    const bestDiscount = findBestDiscount(serviceDiscounts, service.price_cents);
    
    const finalPrice = bestDiscount 
      ? calculateDiscountedPrice(service.price_cents, bestDiscount)
      : service.price_cents;
    
    const savings = service.price_cents - finalPrice;

    const serviceItem: BookableItem = {
      id: service.id,
      name: service.name,
      description: service.description,
      duration_minutes: service.duration_minutes,
      original_price_cents: service.price_cents,
      final_price_cents: finalPrice,
      category_id: service.category_id,
      image_url: service.image_url,
      type: 'service',
      appliedDiscount: bestDiscount,
      savings_cents: savings,
    };

    items.push(serviceItem);
  });

  // Process combos
  combos.forEach(combo => {
    const totalDuration = combo.combo_services.reduce((total, cs) => {
      return total + (cs.services.duration_minutes * cs.quantity);
    }, 0);

    const comboItem: BookableItem = {
      id: combo.id,
      name: combo.name,
      description: combo.description,
      duration_minutes: totalDuration,
      original_price_cents: combo.original_price_cents,
      final_price_cents: combo.total_price_cents,
      image_url: combo.combo_services[0]?.services.image_url,
      type: 'combo',
      savings_cents: combo.original_price_cents - combo.total_price_cents,
      combo_services: combo.combo_services,
    };

    items.push(comboItem);
  });

  return items.sort((a, b) => a.name.localeCompare(b.name));
};

const findBestDiscount = (discounts: Discount[], originalPrice: number): Discount | null => {
  if (discounts.length === 0) return null;

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

const calculateDiscountedPrice = (originalPrice: number, discount: Discount): number => {
  const savings = calculateSavings(discount, originalPrice);
  return Math.max(0, originalPrice - savings);
};