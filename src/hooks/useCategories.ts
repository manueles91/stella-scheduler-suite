import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';

export const useCategories = () => {
  return useQuery<any[], Error>({
    queryKey: ['categories'],
    queryFn: apiService.categories.getActive,
    staleTime: 10 * 60 * 1000, // 10 minutes (categories change less frequently)
  });
};