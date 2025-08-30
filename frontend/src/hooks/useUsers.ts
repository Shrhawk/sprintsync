// User management hooks

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib';
import { useAuthStore } from '../stores/authStore';
import type { RegisterData } from '../types';

export const useUsers = () => {
  const { user } = useAuthStore();
  
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getAllUsers(),
    enabled: user?.is_admin || false,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData: RegisterData) => apiClient.createUser(userData),
    onSuccess: () => {
      // Refetch users list after successful creation
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: Partial<RegisterData> }) => 
      apiClient.updateUser(userId, userData),
    onSuccess: () => {
      // Refetch users list after successful update
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId: string) => apiClient.deleteUser(userId),
    onSuccess: () => {
      // Refetch users list after successful deletion
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

export const useAssignTask = () => {
  // This would be a mutation hook for task assignment
  // Implementation would go here if we need separate assignment calls
};
