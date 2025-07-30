import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api';
import { Employee } from '@/types/booking';

export const useEmployees = () => {
  return useQuery<Employee[], Error>({
    queryKey: ['employees'],
    queryFn: apiService.employees.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};