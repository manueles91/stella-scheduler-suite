import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { Discount } from '@/types/booking';

export const useDiscounts = () => {
  return useQuery<Discount[], Error>({
    queryKey: ['discounts'],
    queryFn: apiService.discounts.getActive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};