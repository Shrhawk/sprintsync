import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, User as UserIcon, Mail, Lock, Shield } from 'lucide-react';
import { useCreateUser, useUpdateUser } from '../../hooks/useUsers';
import type { User } from '../../types';
import { toast } from 'react-hot-toast';

interface UserFormData {
  full_name: string;
  email: string;
  password?: string;
  is_admin: boolean;
}

interface AdminUserFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser?: User | null;
}

const AdminUserForm: React.FC<AdminUserFormProps> = ({ isOpen, onClose, editingUser }) => {
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  
  const isEditing = !!editingUser;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      is_admin: false,
    },
  });

  // Reset form with editing user data when editingUser changes
  useEffect(() => {
    if (editingUser) {
      reset({
        full_name: editingUser.full_name,
        email: editingUser.email,
        password: '',
        is_admin: editingUser.is_admin,
      });
    } else {
      reset({
        full_name: '',
        email: '',
        password: '',
        is_admin: false,
      });
    }
  }, [editingUser, reset]);

  const onSubmit = async (data: UserFormData) => {
    try {
      if (isEditing && editingUser) {
        const updateData = { ...data };
        // Only include password if it was provided
        if (!updateData.password || updateData.password.trim() === '') {
          delete updateData.password;
        }
        await updateUserMutation.mutateAsync({ 
          userId: editingUser.id, 
          userData: updateData 
        });
        toast.success('User updated successfully!');
      } else {
        // For new users, password is required
        if (!data.password || data.password.trim() === '') {
          toast.error('Password is required for new users');
          return;
        }
        // Ensure password is provided for new users
        const createData = { ...data, password: data.password || '' };
        await createUserMutation.mutateAsync(createData);
        toast.success('User created successfully!');
      }
      reset();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : `Failed to ${isEditing ? 'update' : 'create'} user`;
      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 animate-scale-up">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit User' : 'Add New User'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Full Name */}
          <div className="form-group">
            <label htmlFor="full_name" className="form-label">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('full_name')}
                id="full_name"
                type="text"
                className={`input pl-10 ${errors.full_name ? 'input-error' : ''}`}
                placeholder="Enter full name"
              />
            </div>
            {errors.full_name && (
              <p className="form-error">{errors.full_name.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                id="email"
                type="email"
                className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password {isEditing && <span className="text-gray-500">(leave blank to keep current password)</span>}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('password')}
                id="password"
                type="password"
                className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter password"
              />
            </div>
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>

          {/* Admin Checkbox */}
          <div className="form-group">
            <div className="flex items-center space-x-3">
              <input
                {...register('is_admin')}
                id="is_admin"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="is_admin" className="flex items-center text-sm font-medium text-gray-700">
                <Shield className="h-4 w-4 mr-2 text-gray-400" />
                Grant admin privileges
              </label>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createUserMutation.isPending || updateUserMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                <>
                  <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminUserForm;
