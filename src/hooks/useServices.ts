import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { Service } from '@/types/booking';

export const useServices = () => {
  return useQuery<Service[], Error>({
    queryKey: ['services'],
    queryFn: apiService.services.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};