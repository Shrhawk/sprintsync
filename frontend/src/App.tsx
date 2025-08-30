// Main application component with routing and providers

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './stores/authStore';
import Layout from './components/Layout/Layout';
import LoginForm from './components/Auth/LoginForm';
import RegisterForm from './components/Auth/RegisterForm';
import Dashboard from './pages/Dashboard';
import DailyPlan from './pages/DailyPlan';
import Analytics from './pages/Analytics';
import Kanban from './pages/Kanban';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg opacity-50"></div>
          </div>
        </div>
        <div className="loading-spinner h-8 w-8 mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading SprintSync...</p>
        <p className="text-gray-500 text-sm mt-1">Preparing your workspace</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
            <div className="w-8 h-8 bg-white rounded-lg opacity-50"></div>
          </div>
        </div>
        <div className="loading-spinner h-8 w-8 mb-4"></div>
        <p className="text-gray-600 text-lg font-medium">Loading SprintSync...</p>
        <p className="text-gray-500 text-sm mt-1">Preparing your workspace</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            {/* Public routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginForm />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterForm />
                </PublicRoute>
              }
            />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="daily-plan" element={<DailyPlan />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="profile" element={<Profile />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
      
      {/* React Query Devtools - only in development */}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      
      {/* Toast notifications */}
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          className: '',
          style: {
            background: 'rgb(255 255 255)',
            color: 'rgb(31 41 55)', 
            border: '1px solid rgb(229 231 235)',
            borderRadius: '16px',
            boxShadow: 'var(--shadow-lg)',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '500',
            backdropFilter: 'blur(8px)',
          },
          success: {
            style: {
              background: 'rgb(240 253 244)',
              color: 'rgb(21 128 61)',
              border: '1px solid rgb(187 247 208)',
            },
            iconTheme: {
              primary: 'rgb(34 197 94)',
              secondary: 'rgb(240 253 244)',
            },
          },
          error: {
            style: {
              background: 'rgb(254 242 242)',
              color: 'rgb(220 38 38)',
              border: '1px solid rgb(254 202 202)',
            },
            iconTheme: {
              primary: 'rgb(239 68 68)',
              secondary: 'rgb(254 242 242)',
            },
          },
          loading: {
            style: {
              background: 'rgb(239 246 255)',
              color: 'rgb(29 78 216)',
              border: '1px solid rgb(219 234 254)',
            },
            iconTheme: {
              primary: 'rgb(59 130 246)',
              secondary: 'rgb(239 246 255)',
            },
          },
        }}
      />
    </QueryClientProvider>
  );
};

export default App;