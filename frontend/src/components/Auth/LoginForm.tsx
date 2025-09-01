import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Zap, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginForm: React.FC = () => {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err: unknown) {
      // console.log('login error:', err); // debug
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
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
          <div className="mx-auto h-16 w-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg hover:shadow-primary mb-6 animate-scale-in hover:scale-105 transition-all duration-300">
            <div className="relative">
              <Zap className="h-8 w-8 text-white" />
              <Sparkles className="h-4 w-4 text-primary-200 absolute -top-1 -right-1" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 animate-fade-in">
            Welcome to <span className="text-gradient">SprintSync</span>
          </h1>
          <p className="text-gray-600 text-lg animate-fade-in">
            AI-powered project management for modern teams
          </p>
        </div>

        {/* Main Card */}
        <div className="mt-8 animate-slide-up">
          <div className="card shadow-xl">
            <div className="card-body">
              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to your account</h2>
                <p className="text-gray-500">
                  Or{' '}
                  <Link
                    to="/register"
                    className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    create a new account
                  </Link>
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-4">
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
                        autoComplete="current-password"
                        className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                        placeholder="Enter your password"
                      />
                    </div>
                    {errors.password && (
                      <p className="form-error">{errors.password.message}</p>
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
                      <LogIn className="h-5 w-5 text-primary-200 group-hover:text-white transition-colors" />
                    </span>
                    <span className="relative">
                      {isLoading ? (
                        <>
                          <div className="loading-spinner h-4 w-4 mr-2"></div>
                          Signing in...
                        </>
                      ) : (
                        'Sign in'
                      )}
                    </span>
                  </button>
                </div>

                {/* Demo Accounts Section */}
                <div className="mt-8">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500 font-medium">Try demo accounts</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onSubmit({
                          email: import.meta.env.VITE_DEMO_EMAIL || 'demo@sprintsync.com',
                          password: import.meta.env.VITE_DEMO_PASSWORD || 'demo123'
                        });
                      }}
                      className="btn-outline group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-success-400 mr-2"></div>
                        <span>Demo User</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onSubmit({
                          email: import.meta.env.VITE_ADMIN_EMAIL || 'admin@sprintsync.com',
                          password: import.meta.env.VITE_ADMIN_PASSWORD || 'admin123'
                        });
                      }}
                      className="btn-outline group relative overflow-hidden"
                    >
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-warning-400 mr-2"></div>
                        <span>Admin User</span>
                      </div>
                    </button>
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-xs text-gray-500">
                      Demo accounts are pre-populated with sample data
                    </p>
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

export default LoginForm;
