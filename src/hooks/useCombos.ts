import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { Combo } from '@/types/booking';

export const useCombos = () => {
  return useQuery<Combo[], Error>({
    queryKey: ['combos'],
    queryFn: apiService.combos.getActive,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};