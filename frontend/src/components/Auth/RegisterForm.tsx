// Registration form component with form validation

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Mail, Lock, User, Zap, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { toast } from 'react-hot-toast';

const registerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100, 'Name too long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data.email, data.password, data.full_name);
      toast.success('Account created successfully! Welcome to SprintSync!');
      navigate('/');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmMWY1ZjkiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJtMzYgMzQgNi0xIDQgNXYxaDEgMi0xaDEgNi0xbS0zIDMgMTIgMTBtLTggMCAzIDMiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30"></div>
      
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg mb-6 animate-scale-in">
            <div className="relative">
              <Zap className="h-8 w-8 text-white" />
              <Sparkles className="h-4 w-4 text-primary-200 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
            Join <span className="text-gradient">SprintSync</span>
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in">
            Start tracking your productivity today
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 animate-slide-up">
          <div className="card shadow-xl">
            <div className="card-body">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Create your account</h2>
                <p className="text-gray-500">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="form-group">
                    <label htmlFor="full_name" className="form-label">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('full_name')}
                        id="full_name"
                        type="text"
                        autoComplete="name"
                        className={`input pl-10 ${errors.full_name ? 'input-error' : ''}`}
                        placeholder="Enter your full name"
                      />
                    </div>
                    {errors.full_name && (
                      <p className="form-error">{errors.full_name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        autoComplete="email"
                        className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                        placeholder="Enter your email"
                      />
                    </div>
                    {errors.email && (
                      <p className="form-error">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="form-group">
                    <label htmlFor="password" className="form-label">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('password')}
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                        placeholder="Create a password"
                      />
                    </div>
                    {errors.password && (
                      <p className="form-error">{errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        {...register('confirmPassword')}
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm your password"
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="form-error">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full btn-lg group relative overflow-hidden"
                  >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                      <UserPlus className="h-5 w-5 text-primary-200 group-hover:text-white transition-colors" />
                    </span>
                    <span className="relative">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </span>
                  </button>
                </div>

                {/* Benefits Section */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Why join SprintSync?</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                      <span>AI-powered task descriptions and daily planning</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-success-400"></div>
                      <span>Beautiful task management with time tracking</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                      <div className="w-2 h-2 rounded-full bg-warning-400"></div>
                      <span>Analytics and productivity insights</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center animate-fade-in">
          <p className="text-sm text-gray-500">
            Built with ❤️ for modern development teams
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
