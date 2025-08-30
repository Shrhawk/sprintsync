// Custom hooks for AI features using React Query

import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib';
import { toast } from 'react-hot-toast';
import type { AISuggestion } from '../types';

export const useSuggestTaskDescription = () => {
  return useMutation<AISuggestion, Error, { title: string; context?: string }>({
    mutationFn: ({ title, context }: { title: string; context?: string }) => 
      apiClient.suggestTaskDescription(title, context),
    onError: () => {
      toast.error('Failed to generate AI suggestion');
    },
  });
};

export const useDailyPlan = () => {
  return useQuery({
    queryKey: ['daily-plan'],
    queryFn: async () => {
      console.log('useDailyPlan: Making API call...');
      try {
        const plan = await apiClient.getDailyPlan();
        console.log('useDailyPlan: Plan received:', plan);
        return plan;
      } catch (error) {
        console.error('useDailyPlan: Error fetching daily plan:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
    enabled: true, // Explicitly enable the query
  });
};

export const useRefreshDailyPlan = () => {
  return useMutation({
    mutationFn: apiClient.getDailyPlan,
    onSuccess: () => {
      toast.success('Daily plan generated successfully!');
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate daily plan';
      toast.error(errorMessage);
    },
  });
};
