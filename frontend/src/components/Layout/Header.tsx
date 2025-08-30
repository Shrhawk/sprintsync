// Main header component with navigation and user menu

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, User, Settings, BarChart3, Zap, Sparkles, Calendar, Home, Shield, Columns, Menu, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  if (!user) return null;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home, current: location.pathname === '/' },
    { name: 'Daily Plan', href: '/daily-plan', icon: Calendar, current: location.pathname === '/daily-plan' },
    { name: 'Kanban', href: '/kanban', icon: Columns, current: location.pathname === '/kanban' },
    { name: 'Analytics', href: '/analytics', icon: BarChart3, current: location.pathname === '/analytics' },
    ...(user.is_admin ? [{ name: 'Admin Panel', href: '/admin', icon: Shield, current: location.pathname === '/admin' }] : []),
  ];

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="container-app">
        <div className="flex justify-between h-16">
          {/* Logo and main navigation */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-200">
                  <Zap className="h-5 w-5 text-white" />
                  <Sparkles className="h-3 w-3 text-primary-200 absolute -top-0.5 -right-0.5" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors">
                  SprintSync
                </h1>
                <p className="text-xs text-gray-500 -mt-0.5">AI-Powered</p>
              </div>
            </Link>
            
            <nav className="hidden md:ml-8 md:flex md:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`nav-link ${
                      item.current ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="btn-ghost p-2"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* User menu and actions */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* User info */}
            <div className="hidden lg:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.full_name}
                </p>
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500">{user.email}</p>
                  {user.is_admin && (
                    <span className="badge badge-primary text-2xs">
                      Admin
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
            
            {/* User dropdown */}
            <div className="relative group">
              <button className="btn-ghost p-2 lg:hidden">
                <User size={20} />
              </button>
              
              <button className="hidden lg:flex items-center space-x-2 btn-ghost">
                <Settings size={16} />
                <span className="text-sm">Settings</span>
              </button>
              
              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg ring-1 ring-black/5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-40 transform translate-y-1 group-hover:translate-y-0">
                <div className="p-2">
                  {/* User info in dropdown (mobile) */}
                  <div className="lg:hidden px-3 py-2 border-b border-gray-100 mb-2">
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.is_admin && (
                        <span className="badge badge-primary text-2xs">Admin</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Navigation (mobile) */}
                  <div className="md:hidden space-y-1 border-b border-gray-100 pb-2 mb-2">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                            item.current 
                              ? 'bg-primary-50 text-primary-700' 
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.name}
                        </Link>
                      );
                    })}
                  </div>
                  
                  {/* Menu items */}
                  <Link
                    to="/profile"
                    className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="mr-3 text-gray-400" />
                    Profile Settings
                  </Link>
                  <Link
                    to="/analytics"
                    className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 size={16} className="mr-3 text-gray-400" />
                    View Analytics
                  </Link>
                  
                  <div className="border-t border-gray-100 my-2" />
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} className="mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sidebar */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 md:hidden"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(12px) saturate(180%)',
              WebkitBackdropFilter: 'blur(12px) saturate(180%)',
              zIndex: 45
            }}
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Sidebar */}
          <div className="fixed left-0 top-0 h-full w-80 max-w-[85vw] md:hidden animate-slide-in-left bg-white shadow-2xl z-50 border-r border-gray-200/60">
            {/* Header Section */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-white">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">SprintSync</h1>
                  <p className="text-xs text-gray-500 -mt-0.5">AI-Powered</p>
                </div>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* User Info Section */}
            <div className="p-5 border-b border-gray-200/80 bg-gradient-to-r from-white to-gray-50/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </p>
                  {user?.is_admin && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 mt-1">
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Section */}
            <div className="flex-1 overflow-y-auto bg-white">
              <nav className="p-5 space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                        item.current
                          ? 'bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border-2 border-primary-200 shadow-primary'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:scale-105'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions Section */}
            <div className="p-5 border-t border-gray-200/80 bg-gradient-to-r from-white to-gray-50/30">
              <div className="space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center px-4 py-3 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-all duration-300 hover:scale-105"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Profile Settings</span>
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-3 text-sm font-semibold text-red-600 rounded-xl hover:bg-red-50 hover:text-red-700 transition-all duration-300 hover:scale-105"
                >
                  <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;
