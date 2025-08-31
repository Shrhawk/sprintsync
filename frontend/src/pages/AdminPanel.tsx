// Admin panel page for user management and system overview

import React, { useState } from 'react';
import { Activity, Shield, Users, BarChart3, Settings, Layout, Clock, Search, Filter, CheckCircle, Circle, X, Plus, Edit, Trash2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import AdminAnalytics from '../components/Admin/AdminAnalytics';
import { useUsers } from '../hooks/useUsers';
import { apiClient } from '../lib';
import type { User, Task } from '../types';
import Dropdown, { type DropdownOption } from '../components/Layout/Dropdown';
import AdminUserForm from '../components/Admin/AdminUserForm';
import DeleteUserModal from '../components/Admin/DeleteUserModal';

type AdminSection = 'overview' | 'users' | 'tasks' | 'analytics' | 'settings';

const AdminPanel: React.FC = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');

  // Redirect if not admin
  if (!user?.is_admin) {
    return <Navigate to="/" replace />;
  }

  const navigationTabs = [
    { 
      id: 'overview' as AdminSection, 
      name: 'Overview', 
      icon: Layout
    },
    { 
      id: 'users' as AdminSection, 
      name: 'Users', 
      icon: Users
    },
    { 
      id: 'tasks' as AdminSection, 
      name: 'Tasks', 
      icon: Clock
    },
    { 
      id: 'analytics' as AdminSection, 
      name: 'Analytics', 
      icon: BarChart3
    },
    { 
      id: 'settings' as AdminSection, 
      name: 'Settings', 
      icon: Settings
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 animate-fade-in">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-sm">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="section-title">Admin Panel</h1>
                <p className="section-subtitle">System management and oversight</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2">
              <Shield className="h-4 w-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-900">Administrator Access</span>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-1 overflow-x-auto pb-px scrollbar-hide">
            {navigationTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id)}
                  className={`
                    flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg whitespace-nowrap transition-all duration-200 flex-shrink-0
                    ${isActive
                      ? 'bg-white text-primary-700 border-b-2 border-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-primary-600' : 'text-gray-400'}`} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && <OverviewSection />}
        {activeSection === 'users' && <UserManagementSection />}
        {activeSection === 'tasks' && <TaskManagementSection />}
        {activeSection === 'analytics' && <AdminAnalytics />}
        {activeSection === 'settings' && <SettingsSection />}
      </div>
    </div>
  );
};

// Overview Section Component
const OverviewSection: React.FC = () => {
  const { data: users } = useUsers();
  const { data: allTasks } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => apiClient.getAllTasks()
  });

  const totalUsers = users?.length || 0;
  const totalTasks = allTasks?.length || 0;
  const completedTasks = allTasks?.filter((task: Task) => task.status === 'DONE').length || 0;
  const totalMinutes = allTasks?.reduce((sum: number, task: Task) => sum + (task.total_minutes || 0), 0) || 0;
  const avgMinutesPerTask = totalTasks > 0 ? Math.round(totalMinutes / totalTasks) : 0;

  return (
    <div className="space-y-8">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-success-600 mt-1 font-medium">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></span>
                    {totalUsers} active
                  </span>
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{totalTasks}</p>
                <p className="text-xs text-primary-600 mt-1 font-medium">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% completed
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Time</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round(totalMinutes / 60)}h</p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  {totalUsers > 0 ? Math.round(totalMinutes / 60 / totalUsers) : 0}h avg/user
                </p>
              </div>
              <div className="p-3 bg-accent-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-8 w-8 text-accent-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Avg per Task</p>
                <p className="text-3xl font-bold text-gray-900">{avgMinutesPerTask}m</p>
                <p className="text-xs text-success-600 mt-1 font-medium">
                  <span className="inline-flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    System healthy
                  </span>
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-8 w-8 text-warning-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <p className="text-sm text-gray-600 mt-1">Current system health and operational status</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Database Connection</p>
                  <p className="text-xs text-gray-600">All database operations running normally</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Healthy
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">API Services</p>
                  <p className="text-xs text-gray-600">All API endpoints responding correctly</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Admin Features</p>
                  <p className="text-xs text-gray-600">All admin functionalities available</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// User Management Section Component
const UserManagementSection: React.FC = () => {
  const { data: users, isLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  
  const filteredUsers = users?.filter((user: User) => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddUserModalOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
  };

  const handleCloseModals = () => {
    setIsAddUserModalOpen(false);
    setEditingUser(null);
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="relative group">
          <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md focus:shadow-md"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Users ({filteredUsers.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">Manage system users and their permissions</p>
            </div>
            <button 
              onClick={() => {
                setEditingUser(null);
                setIsAddUserModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 text-white text-sm font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </button>
          </div>
        </div>
        
        {/* Mobile-friendly user cards */}
        <div className="divide-y divide-gray-200">
          {filteredUsers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? `No users match "${searchTerm}"` : 'Get started by adding your first user.'}
              </p>
              {!searchTerm && (
                <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First User
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map((user: User) => (
            <div key={user.id} className="p-6 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-sm">
                    <span className="text-white font-semibold">
                      {user.full_name.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {user.full_name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{user.email}</p>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.is_admin 
                              ? 'badge-primary' 
                              : 'badge-gray'
                          }`}>
                            {user.is_admin ? 'Administrator' : 'User'}
                          </span>
                          <span className="badge-success">
                            Active
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-sm text-gray-500">
                          Joined {new Date(user.created_at || '').toLocaleDateString()}
                        </p>
                        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEditUser(user)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          {!user.is_admin && (
                            <button 
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <AdminUserForm
        isOpen={isAddUserModalOpen}
        onClose={handleCloseModals}
        editingUser={editingUser}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={!!userToDelete}
        onClose={handleCloseModals}
        userToDelete={userToDelete}
      />
    </div>
  );
};

// Task Management Section Component
const TaskManagementSection: React.FC = () => {
  const { data: allTasks, isLoading } = useQuery({
    queryKey: ['admin-tasks'],
    queryFn: () => apiClient.getAllTasks()
  });
  
  const { data: users } = useUsers();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Status options for dropdown
  const statusOptions: DropdownOption[] = [
    {
      value: 'all',
      label: 'All Status',
      icon: <Filter size={16} className="text-slate-500" />,
      description: 'Show tasks with any status'
    },
    {
      value: 'TODO',
      label: 'To Do',
      icon: <Circle size={16} className="text-gray-500" />,
      description: 'Tasks not yet started'
    },
    {
      value: 'IN_PROGRESS',
      label: 'In Progress',
      icon: <Clock size={16} className="text-blue-500" />,
      description: 'Tasks currently being worked on'
    },
    {
      value: 'DONE',
      label: 'Done',
      icon: <CheckCircle size={16} className="text-green-500" />,
      description: 'Completed tasks'
    }
  ];
  
  const filteredTasks = allTasks?.filter((task: Task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="loading-spinner h-8 w-8"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO': return 'badge-gray';
      case 'IN_PROGRESS': return 'badge-primary';
      case 'DONE': return 'badge-success';
      default: return 'badge-gray';
    }
  };



  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-6 border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="text"
                placeholder="Search tasks by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md focus:shadow-md"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full sm:w-48">
            <Dropdown
              options={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
              placeholder="Filter by status..."
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Tasks ({filteredTasks.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">View and manage all system tasks</p>
        </div>
        
        {/* Mobile-friendly task cards */}
        <div className="divide-y divide-gray-200">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-fit mx-auto mb-4">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm ? `No tasks match "${searchTerm}"` : statusFilter !== 'all' ? `No tasks with ${statusFilter.toLowerCase().replace('_', ' ')} status` : 'No tasks available yet.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task: Task) => {
            const assignedUser = users?.find((u: User) => u.id === task.assigned_to);
            return (
              <div key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">
                      {task.title}
                    </h4>
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`${getStatusColor(task.status)}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                      
                      {assignedUser ? (
                        <div className="flex items-center">
                          <div className="h-6 w-6 bg-primary-100 rounded-full flex items-center justify-center mr-2">
                            <span className="text-xs text-primary-600 font-medium">
                              {assignedUser.full_name.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <span className="text-sm text-gray-600">{assignedUser.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Unassigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right sm:ml-4">
                    <p className="text-sm font-medium text-gray-900">
                      {Math.round((task.total_minutes || 0) / 60)}h {(task.total_minutes || 0) % 60}m
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(task.created_at || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// Settings Section Component
const SettingsSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">General Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Basic system configuration</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">System Maintenance</h4>
                  <p className="text-sm text-gray-600 mt-1">Enable maintenance mode</p>
                </div>
                <button className="bg-gray-200 relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors">
                  <span className="translate-x-1 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">User Registration</h4>
                  <p className="text-sm text-gray-600 mt-1">Allow new user signups</p>
                </div>
                <button className="bg-primary-500 relative inline-flex h-6 w-11 items-center rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300 transition-colors">
                  <span className="translate-x-6 inline-block h-4 w-4 rounded-full bg-white transition"></span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
            <p className="text-sm text-gray-600 mt-1">Security and access control</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Two-Factor Auth</h4>
                  <p className="text-sm text-gray-600 mt-1">Require 2FA for admin users</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Coming Soon
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900">Session Timeout</h4>
                  <p className="text-sm text-gray-600 mt-1">Auto logout after inactivity</p>
                </div>
                <span className="text-sm font-medium text-gray-900">24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
            <p className="text-sm text-gray-600 mt-1">API settings and integrations</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <h4 className="font-medium text-green-900">API Status</h4>
                  <p className="text-sm text-green-600 mt-1">All endpoints operational</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900">Rate Limiting</h4>
                <p className="text-sm text-gray-600 mt-1">1000 requests per hour per user</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Settings */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Database</h3>
            <p className="text-sm text-gray-600 mt-1">Database health and backup</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                <div>
                  <h4 className="font-medium text-green-900">Connection Status</h4>
                  <p className="text-sm text-green-600 mt-1">Database connected</p>
                </div>
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-xl">
                <h4 className="font-medium text-gray-900">Last Backup</h4>
                <p className="text-sm text-gray-600 mt-1">Auto-backups enabled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;