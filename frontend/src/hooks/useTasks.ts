import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskStatus } from '../types';
import type { CreateTaskData, UpdateTaskData, Task } from '../types';
import { apiClient } from '../lib';
import { toast } from 'react-hot-toast';

export const useTasks = () => {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      // console.log('fetching tasks...');
      const tasks = await apiClient.getTasks();
      return tasks;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTask = (id: string) => {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: () => apiClient.getTask(id),
    enabled: !!id,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateTaskData) => apiClient.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created!');
    },
    onError: () => {
      toast.error('Failed to create task');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskData }) => 
      apiClient.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated!');
    },
    onError: () => {
      toast.error('Failed to update task');
    },
  });
};

export const useUpdateTaskStatus = () => {
  const qc = useQueryClient(); // shorter name
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => {
      return apiClient.updateTaskStatus(id, status);
    },
    onSuccess: (task: Task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      
      // TODO: Could make these messages more dynamic
      const msgs = {
        [TaskStatus.TODO]: 'Moved to Todo',
        [TaskStatus.IN_PROGRESS]: 'Started!',
        [TaskStatus.DONE]: 'Done! 🎉',
      };
      
      toast.success(msgs[task.status as TaskStatus] || 'Task updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });
};

export const useAddTimeToTask = () => {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, minutes }: { id: string; minutes: number }) => 
      apiClient.addTimeToTask(id, minutes),
    onSuccess: (task: Task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success(`+${task.total_minutes}min logged`); // more casual
    },
    onError: () => {
      toast.error('Failed to add time');
    },
  });
};

export const useDeleteTask = () => {
  const qc = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiClient.deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Deleted');
    },
    onError: () => {
      toast.error('Delete failed');
    },
  });
};
