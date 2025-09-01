// Task creation and editing form with AI suggestions

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Sparkles, Loader2, Users, User as UserIcon } from 'lucide-react';
import type { Task, CreateTaskData, UpdateTaskData, User } from '../../types';
import { useCreateTask, useUpdateTask } from '../../hooks/useTasks';
import { useSuggestTaskDescription } from '../../hooks/useAI';
import { useUsers } from '../../hooks/useUsers';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';
import Dropdown, { type DropdownOption } from '../Layout/Dropdown';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().max(20000, 'Description must be less than 20000 characters').optional(),
  assigned_to: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  task?: Task;
  onClose: () => void;
  onSuccess?: () => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ task, onClose, onSuccess }) => {
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [aiSuggestion, setAISuggestion] = useState('');
  
  const { user: currentUser } = useAuthStore();
  const { data: users = [] } = useUsers();

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const suggestDescriptionMutation = useSuggestTaskDescription();

  // Convert users to dropdown options
  const userOptions: DropdownOption[] = [
    {
      value: '',
      label: 'Assign to myself',
      icon: <UserIcon size={16} className="text-primary-500" />,
      description: 'Task will be assigned to you'
    },
    ...users.map((user: User) => ({
      value: user.id,
      label: user.full_name,
      icon: user.is_admin 
        ? <Users size={16} className="text-warning-600" /> 
        : <UserIcon size={16} className="text-primary-600" />,
      description: user.is_admin 
        ? `${user.email} • Administrator` 
        : user.email
    }))
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      assigned_to: task?.assigned_to || '',
    },
  });

  const titleValue = watch('title');

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description || '',
        assigned_to: task.assigned_to || '',
      });
    }
  }, [task, reset]);

  const onSubmit = async (data: TaskFormData) => {
    console.log('TaskForm: Submitting task data', { task: task?.id, data });
    
    if (task) {
      console.log('TaskForm: Updating existing task');
      updateTaskMutation.mutate({
        id: task.id,
        data: data as UpdateTaskData,
      }, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
          console.log('TaskForm: Task updated successfully');
        }
      });
    } else {
      console.log('TaskForm: Creating new task');
      createTaskMutation.mutate(data as CreateTaskData, {
        onSuccess: () => {
          onSuccess?.();
          onClose();
          console.log('TaskForm: Task created successfully');
        }
      });
    }
  };

  const handleAISuggestion = async () => {
    if (!titleValue.trim()) {
      toast.error('Please enter a task title first');
      return;
    }

    try {
      const suggestion = await suggestDescriptionMutation.mutateAsync({
        title: titleValue,
      });
      setAISuggestion(suggestion.suggestion);
      setShowAISuggestion(true);
    } catch (error: unknown) {
      console.error('Failed to generate AI suggestion:', error);
      toast.error('Failed to generate AI suggestion');
    }
  };

  const applyAISuggestion = () => {
    setValue('description', aiSuggestion);
    setShowAISuggestion(false);
    toast.success('AI suggestion applied!');
  };

  const isLoading = createTaskMutation.isPending || updateTaskMutation.isPending;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {task ? 'Edit Task' : 'Create New Task'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {task ? 'Update your task details' : 'Add a new task to your workflow'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 hover:bg-gray-100 rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Title Field */}
            <div className="form-group">
              <label htmlFor="title" className="form-label">
                Task Title *
              </label>
              <input
                {...register('title')}
                id="title"
                type="text"
                className={`input ${errors.title ? 'input-error' : ''}`}
                placeholder="Enter a clear, actionable task title..."
              />
              {errors.title && (
                <p className="form-error">{errors.title.message}</p>
              )}
            </div>

            {/* Description Field */}
            <div className="form-group">
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="description" className="form-label">
                  Description
                </label>
                <button
                  type="button"
                  onClick={handleAISuggestion}
                  disabled={suggestDescriptionMutation.isPending || !titleValue.trim()}
                  className="btn-outline btn-sm group disabled:opacity-50"
                >
                  {suggestDescriptionMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin mr-2" />
                  ) : (
                    <Sparkles size={14} className="mr-2 text-primary-500 group-hover:text-primary-600" />
                  )}
                  <span>AI Assist</span>
                </button>
              </div>
              <textarea
                {...register('description')}
                id="description"
                rows={4}
                className={`input resize-none ${errors.description ? 'input-error' : ''}`}
                placeholder="Provide detailed information about the task, requirements, and acceptance criteria..."
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
              <p className="form-helper">
                Tip: Clear descriptions help with better task management and AI suggestions
              </p>
            </div>

            {/* Assignment Field (Admin Only) */}
            {currentUser?.is_admin && (
              <div className="form-group">
                <label htmlFor="assigned_to" className="form-label flex items-center">
                  <Users size={16} className="mr-2 text-primary-500" />
                  Assign to User
                </label>
                <Dropdown
                  options={userOptions}
                  value={watch('assigned_to') || ''}
                  onChange={(value) => setValue('assigned_to', value)}
                  placeholder="Select a user to assign..."
                  searchable
                  clearable
                />
                <p className="form-helper">
                  Choose who should work on this task. Leave empty to assign to yourself.
                </p>
              </div>
            )}

            {/* AI Suggestion */}
            {showAISuggestion && (
              <div className="card border border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100 animate-slide-up">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-primary-200 rounded-lg">
                        <Sparkles size={14} className="text-primary-700" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-primary-900">AI Suggestion</h4>
                        <p className="text-xs text-primary-700">Generated based on your task title</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAISuggestion(false)}
                      className="btn-ghost p-1 text-primary-600 hover:text-primary-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="bg-white/50 rounded-lg p-3 mb-3 border border-primary-200 max-h-60 overflow-y-auto">
                    <p className="text-sm text-primary-800 whitespace-pre-wrap leading-relaxed">
                      {aiSuggestion}
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={applyAISuggestion}
                    className="btn-primary btn-sm"
                  >
                    <Sparkles size={14} className="mr-2" />
                    Apply This Suggestion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="flex justify-end space-x-3 p-6 pt-4 border-t border-gray-100 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary relative overflow-hidden"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner h-4 w-4 mr-2"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <span>{task ? 'Update Task' : 'Create Task'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default TaskForm;
