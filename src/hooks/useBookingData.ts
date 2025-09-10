import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Service, Employee, TimeSlot, Combo, Discount, BookableItem } from "@/types/booking";
import { format, addMinutes, parseISO, isSameDay, isAfter } from "date-fns";
import { useBookingContext } from "@/contexts/BookingContext";
import { useSearchParams } from "react-router-dom";

export const useBookingData = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [bookableItems, setBookableItems] = useState<BookableItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedCategory, setSelectedCategory } = useBookingContext();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchServices();
    fetchCombos();
    fetchDiscounts();
    fetchEmployees();
    fetchCategories();
  }, []);

  // Set default category to 'promociones' only if no service is pre-selected
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (!serviceId && !selectedCategory && categories.length > 0) {
      setSelectedCategory('promociones');
    }
  }, [searchParams, selectedCategory, categories, setSelectedCategory]);

  // Process services and combos into bookable items with discounts
  useEffect(() => {
    const processedItems = processBookableItems();
    setBookableItems(processedItems);
  }, [services, combos, discounts]);

  // Filter bookable items by category
  const filteredBookableItems = useMemo(() => {
    if (!selectedCategory) return bookableItems;
    
    const filtered = bookableItems.filter(item => {
      // Handle "promociones" category - show items with discounts or combos
      if (selectedCategory === 'promociones') {
        return item.type === 'combo' || (item.type === 'service' && item.appliedDiscount);
      }
      
      if (item.type === 'service') {
        return item.category_id === selectedCategory;
      } else if (item.type === 'combo' && item.combo_services) {
        // For combos, check if any service in the combo belongs to the selected category
        const serviceIds = item.combo_services.map(cs => cs.service_id);
        return services.some(service => 
          serviceIds.includes(service.id) && service.category_id === selectedCategory
        );
      }
      return false;
    });
    
    return filtered;
  }, [bookableItems, selectedCategory, services]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_categories (
          id,
          name,
          display_order
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
      return;
    }

    setServices(data || []);
  };

  const fetchCombos = async () => {
    const now = new Date();
    const nowISO = now.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('combos')
      .select(`
        *,
        combo_services (
          service_id,
          quantity,
          services (
            id,
            name,
            description,
            duration_minutes,
            price_cents,
            image_url
          )
        )
      `)
      .eq('is_active', true)
      .lte('start_date', nowISO)
      .gte('end_date', nowISO)
      .order('name');

    if (error) {
      console.error('Error fetching combos:', error);
      return;
    }

    setCombos(data || []);
  };

  const fetchDiscounts = async () => {
    const now = new Date();
    const nowISO = now.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true) // Only fetch public discounts
      .lte('start_date', nowISO)
      .gte('end_date', nowISO)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discounts:', error);
      return;
    }

    setDiscounts(data || []);
  };

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        employee_services (
          service_id
        )
      `)
      .in('role', ['employee', 'admin'])
      .order('full_name');

    if (error) {
      console.error('Error fetching employees:', error);
      return;
    }

    setEmployees(data || []);
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const processBookableItems = (): BookableItem[] => {
    const items: BookableItem[] = [];



    // Process services with discounts
    services.forEach(service => {
      const serviceDiscounts = discounts.filter(d => d.service_id === service.id);
      const bestDiscount = findBestDiscount(serviceDiscounts, service.price_cents);
      
      const finalPrice = bestDiscount 
        ? calculateDiscountedPrice(service.price_cents, bestDiscount)
        : service.price_cents;
      
      const savings = service.price_cents - finalPrice;

      const serviceItem = {
        id: service.id,
        name: service.name,
        description: service.description,
        duration_minutes: service.duration_minutes,
        original_price_cents: service.price_cents,
        final_price_cents: finalPrice,
        category_id: service.category_id,
        image_url: service.image_url,
        variable_price: (service as any).variable_price ?? false,
        type: 'service' as const,
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

      const comboItem = {
        id: combo.id,
        name: combo.name,
        description: combo.description,
        duration_minutes: totalDuration,
        original_price_cents: combo.original_price_cents,
        final_price_cents: combo.total_price_cents,
        image_url: (combo as any).image_url || null,
        type: 'combo' as const,
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

  const fetchAvailableSlots = useCallback(async (
    selectedService: BookableItem | null,
    selectedDate: Date | undefined,
    selectedEmployee: Employee | null
  ): Promise<TimeSlot[]> => {
    if (!selectedService || !selectedDate) return [];

    setLoading(true);
    
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const dayOfWeek = selectedDate.getDay();
      
      // Skip Sundays (day 0)
      if (dayOfWeek === 0) {
        return [];
      }

      // Get employees who can perform this service/combo
      let availableEmployees = selectedEmployee 
        ? [selectedEmployee] 
        : employees.filter(emp => {
          if (selectedService.type === 'service') {
            return emp.employee_services.some(es => es.service_id === selectedService.id);
          } else {
            // For combos, check if employee can perform all services in the combo
            return selectedService.combo_services?.every(cs => 
              emp.employee_services.some(es => es.service_id === cs.service_id)
            ) || false;
          }
        });
      
      // Fallback: if no employees are assigned to this service, use all employees
      if (availableEmployees.length === 0 && employees.length > 0) {
        availableEmployees = employees;
      }
      
      // If still no employees, create a dummy employee for demo purposes
      if (availableEmployees.length === 0) {
        const demoEmployee: Employee = {
          id: 'demo-employee',
          full_name: 'Estilista Disponible',
          employee_services: [{ service_id: selectedService.id }]
        };
        availableEmployees = [demoEmployee];
      }

      // Get existing reservations for this date
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('*')
        .eq('appointment_date', dateStr)
        .neq('status', 'cancelled');

      if (reservationError) {
        console.error('Error fetching reservations:', reservationError);
        return [];
      }

      // Generate time slots using fixed business hours
      const slots: TimeSlot[] = [];
      const startHour = 9; // 9 AM
      const endHour = 18;  // 6 PM
      const serviceDuration = selectedService.duration_minutes;
      const now = new Date();
      const isToday = isSameDay(selectedDate, now);

      for (const employee of availableEmployees) {
        for (let hour = startHour; hour < endHour; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const slotDateTime = parseISO(`${dateStr}T${timeString}`);
            const slotEndTime = addMinutes(slotDateTime, serviceDuration);
            
            // Only show slots that are in the future (if today)
            const isFutureSlot = !isToday || isAfter(slotDateTime, now);
            
            // Check if slot conflicts with existing reservations
            const hasConflict = reservations?.some((reservation) => {
              if (reservation.employee_id !== employee.id) return false;
              const resStart = parseISO(`${dateStr}T${reservation.start_time}`);
              const resEnd = parseISO(`${dateStr}T${reservation.end_time}`);
              return slotDateTime < resEnd && slotEndTime > resStart;
            });
            
            if (isFutureSlot && !hasConflict) {
              slots.push({
                start_time: timeString,
                employee_id: employee.id,
                employee_name: employee.full_name,
                available: true,
              });
            }
          }
        }
      }

      // Sort slots by time
      return slots.sort((a, b) => a.start_time.localeCompare(b.start_time));
    } finally {
      setLoading(false);
    }
  }, [employees]);

  const formatPrice = (cents: number) => {
    return `₡${Math.round(cents / 100)}`;
  };

  return {
    services,
    combos,
    discounts,
    bookableItems: filteredBookableItems,
    allBookableItems: bookableItems, // Unfiltered items for admin purposes
    categories,
    employees,
    loading,
    selectedCategory,
    setSelectedCategory,
    fetchAvailableSlots,
    formatPrice,
  };
}; 