// Main dashboard page with task list and overview

import React, { useState } from 'react';
import { Plus, Filter, BarChart3, Clock, CheckCircle, AlertCircle, Circle, TrendingUp, Calendar } from 'lucide-react';
import { TaskStatus, type Task } from '../types';
import { useTasks } from '../hooks/useTasks';
import { useAuthStore } from '../stores/authStore';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';

const Dashboard: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');

  const { data: tasks, isLoading, error } = useTasks();
  const { isAuthenticated, user, token } = useAuthStore();
  
  // Debug logging
  console.log('Dashboard: Auth state - isAuthenticated:', isAuthenticated, 'user:', user, 'token:', token ? 'YES' : 'NO');
  console.log('Dashboard: tasks:', tasks);
  console.log('Dashboard: isLoading:', isLoading);
  console.log('Dashboard: error:', error);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const filteredTasks = tasks?.filter((task: Task) => 
    statusFilter === 'ALL' || task.status === statusFilter
  ) || [];

  const taskStats = {
    total: tasks?.length || 0,
    todo: tasks?.filter((t: Task) => t.status === TaskStatus.TODO).length || 0,
    inProgress: tasks?.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length || 0,
    done: tasks?.filter((t: Task) => t.status === TaskStatus.DONE).length || 0,
    totalMinutes: tasks?.reduce((sum: number, task: Task) => sum + task.total_minutes, 0) || 0,
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="loading-spinner h-12 w-12 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your tasks...</p>
        <p className="text-gray-500 text-sm mt-1">Getting everything ready</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load tasks. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">
              Track your tasks and monitor your productivity
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-primary btn-lg group hover:shadow-primary"
            >
              <Plus size={20} className="mr-2 group-hover:rotate-90 transition-transform duration-300" />
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
                <p className="text-xs text-gray-500 mt-1">All tasks</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="h-7 w-7 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">To Do</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.todo}</p>
                <p className="text-xs text-gray-500 mt-1">Pending tasks</p>
              </div>
              <div className="p-3 bg-gray-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Circle className="h-7 w-7 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.inProgress}</p>
                <p className="text-xs text-gray-500 mt-1">Active work</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <AlertCircle className="h-7 w-7 text-primary-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.done}</p>
                <p className="text-xs text-gray-500 mt-1">Finished tasks</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-7 w-7 text-success-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Productivity Overview</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="p-2 bg-primary-100 rounded-lg mx-auto mb-3 w-fit group-hover:scale-110 transition-transform">
                    <Clock className="h-6 w-6 text-primary-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(taskStats.totalMinutes / 60)}h</p>
                  <p className="text-sm text-gray-600">Total Hours</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="p-2 bg-success-100 rounded-lg mx-auto mb-3 w-fit group-hover:scale-110 transition-transform">
                    <TrendingUp className="h-6 w-6 text-success-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                  <div className="p-2 bg-warning-100 rounded-lg mx-auto mb-3 w-fit group-hover:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-warning-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">
                    {taskStats.totalMinutes > 0 ? Math.round(taskStats.totalMinutes / taskStats.total) : 0}m
                  </p>
                  <p className="text-sm text-gray-600">Avg per Task</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="card-body space-y-3">
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-outline w-full justify-start"
            >
              <Plus className="h-4 w-4 mr-3" />
              Create New Task
            </button>
            <button
              onClick={() => setStatusFilter(TaskStatus.IN_PROGRESS)}
              className="btn-outline w-full justify-start"
            >
              <AlertCircle className="h-4 w-4 mr-3" />
              View Active Tasks
            </button>
            <button
              onClick={() => setStatusFilter(TaskStatus.TODO)}
              className="btn-outline w-full justify-start"
            >
              <Circle className="h-4 w-4 mr-3" />
              View Pending Tasks
            </button>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="card">
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Your Tasks</h3>
              <p className="text-sm text-gray-600 mt-1">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'} 
                {statusFilter !== 'ALL' && ` • ${statusFilter.replace('_', ' ').toLowerCase()}`}
              </p>
            </div>
            
            {/* Filters */}
            <div className="flex items-center space-x-3 mt-4 sm:mt-0">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Filter:</span>
              </div>
              <div className="flex space-x-1">
                {['ALL', TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status as TaskStatus | 'ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                      statusFilter === status
                        ? 'bg-primary-100 text-primary-700 shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                    }`}
                  >
                    {status === 'ALL' ? 'All Tasks' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-body">
          {/* Task List */}
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto h-20 w-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mb-6">
                <Plus className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tasks found</h3>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                {statusFilter === 'ALL' 
                  ? "Ready to boost your productivity? Create your first task and start achieving your goals."
                  : `No tasks with status "${statusFilter.replace('_', ' ').toLowerCase()}". Try adjusting your filter or create a new task.`
                }
              </p>
              {statusFilter === 'ALL' && (
                <button
                  onClick={() => setShowTaskForm(true)}
                  className="btn-primary btn-lg"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Task
                </button>
              )}
              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="btn-outline"
                >
                  View All Tasks
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTasks.map((task: Task, index: number) => (
                <div
                  key={task.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TaskCard
                    task={task}
                    onEdit={handleEditTask}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Form Modal */}
      {showTaskForm && (
                  <TaskForm
            task={editingTask || undefined}
            onClose={handleCloseForm}
            onSuccess={() => setShowTaskForm(false)}
          />
      )}
    </div>
  );
};

export default Dashboard;
