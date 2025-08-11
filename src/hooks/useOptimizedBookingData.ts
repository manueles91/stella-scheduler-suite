import { useMemo, useCallback } from 'react';
import { useServices } from './useServices';
import { useCombos } from './useCombos';
import { useDiscounts } from './useDiscounts';
import { useEmployees } from './useEmployees';
import { useCategories } from './useCategories';
import { BookableItem, TimeSlot, Employee } from '@/types/booking';
import { format, parseISO, addMinutes } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

export const useOptimizedBookingData = () => {
  const { data: services = [], isLoading: servicesLoading } = useServices();
  const { data: combos = [], isLoading: combosLoading } = useCombos();
  const { data: discounts = [], isLoading: discountsLoading } = useDiscounts();
  const { data: employees = [], isLoading: employeesLoading } = useEmployees();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const loading = servicesLoading || combosLoading || discountsLoading || employeesLoading || categoriesLoading;

  // Memoized discount calculations
  const discountCalculations = useMemo(() => {
    const findBestDiscount = (serviceId: string) => {
      return discounts
        .filter(discount => discount.service_id === serviceId)
        .sort((a, b) => {
          const aValue = a.discount_type === 'percentage' 
            ? (a.discount_value / 100) 
            : a.discount_value;
          const bValue = b.discount_type === 'percentage' 
            ? (b.discount_value / 100) 
            : b.discount_value;
          return bValue - aValue;
        })[0];
    };

    const calculateSavings = (originalPrice: number, discount: any) => {
      if (!discount) return 0;
      
      if (discount.discount_type === 'percentage') {
        return Math.round(originalPrice * (discount.discount_value / 100));
      } else {
        return Math.min(discount.discount_value * 100, originalPrice);
      }
    };

    const calculateDiscountedPrice = (originalPrice: number, discount: any) => {
      const savings = calculateSavings(originalPrice, discount);
      return originalPrice - savings;
    };

    return { findBestDiscount, calculateSavings, calculateDiscountedPrice };
  }, [discounts]);

  // Memoized bookable items processing
  const bookableItems = useMemo(() => {
    const items: BookableItem[] = [];

    // Process services
    services.forEach(service => {
      const bestDiscount = discountCalculations.findBestDiscount(service.id);
      const savings = discountCalculations.calculateSavings(service.price_cents, bestDiscount);
      const finalPrice = discountCalculations.calculateDiscountedPrice(service.price_cents, bestDiscount);

      items.push({
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        original_price_cents: service.price_cents,
        final_price_cents: finalPrice,
        category_id: service.category_id,
        image_url: service.image_url,
        variable_price: (service as any).variable_price ?? false,
        type: 'service',
        appliedDiscount: bestDiscount,
        savings_cents: savings
      });
    });

    // Process combos
    combos.forEach(combo => {
      items.push({
        id: combo.id,
        name: combo.name,
        description: combo.description,
        duration_minutes: combo.combo_services.reduce((total, cs) => total + cs.services.duration_minutes, 0),
        original_price_cents: combo.original_price_cents,
        final_price_cents: combo.total_price_cents,
        image_url: combo.combo_services[0]?.services.image_url,
        type: 'combo',
        savings_cents: combo.original_price_cents - combo.total_price_cents,
        combo_services: combo.combo_services
      });
    });

    return items;
  }, [services, combos, discountCalculations]);

  // Memoized available slots fetcher
  const fetchAvailableSlots = useCallback(async (
    service: BookableItem,
    date: Date,
    selectedEmployee?: Employee | null
  ): Promise<TimeSlot[]> => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Get existing reservations for the date
      const { data: reservations } = await supabase
        .from('reservations')
        .select('start_time, end_time, employee_id')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      // Business hours: 9 AM to 6 PM
      const startHour = 9;
      const endHour = 18;
      const slots: TimeSlot[] = [];

      // Filter employees based on service
      let availableEmployees = employees;
      
      if (service.type === 'service') {
        availableEmployees = employees.filter(emp => 
          emp.employee_services.some(es => es.service_id === service.id)
        );
      }

      if (selectedEmployee) {
        availableEmployees = availableEmployees.filter(emp => emp.id === selectedEmployee.id);
      }

      // Generate time slots for each available employee
      for (const employee of availableEmployees) {
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotStart = parseISO(`${dateStr}T${slotTime}`);
            const slotEnd = addMinutes(slotStart, service.duration_minutes);

            // Check if slot conflicts with existing reservations
            const hasConflict = reservations?.some(reservation => {
              if (reservation.employee_id !== employee.id) return false;
              
              const resStart = parseISO(`${dateStr}T${reservation.start_time}`);
              const resEnd = parseISO(`${dateStr}T${reservation.end_time}`);
              
              return (slotStart < resEnd && slotEnd > resStart);
            });

            if (!hasConflict && slotEnd <= parseISO(`${dateStr}T${endHour}:00`)) {
              slots.push({
                start_time: slotTime,
                employee_id: employee.id,
                employee_name: employee.full_name,
                available: true
              });
            }
          }
        }
      }

      return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  }, [employees]);

  // Memoized price formatter
  const formatPrice = useCallback((cents: number): string => {
    const euros = cents / 100;
    return `€${euros.toFixed(2)}`;
  }, []);

  return {
    bookableItems,
    categories,
    employees,
    loading,
    fetchAvailableSlots,
    formatPrice,
    discounts,
    services,
    combos
  };
};