// Analytics page with task statistics and insights

import React from 'react';
import { BarChart3, TrendingUp, Clock, Activity, Calendar, Award } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { TaskStatus, type Task } from '../types';
import { format } from 'date-fns';
import DailyTimeChart from '../components/Analytics/DailyTimeChart';

// Enhanced analytics page with improved performance metrics
const Analytics: React.FC = () => {
  const { data: tasks, isLoading, error } = useTasks();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="loading-spinner h-12 w-12 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading analytics...</p>
        <p className="text-gray-500 text-sm mt-1">Analyzing your productivity data</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load analytics. Please try again.</p>
      </div>
    );
  }

  // Calculate analytics data
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((t: Task) => t.status === TaskStatus.DONE).length || 0;
  const inProgressTasks = tasks?.filter((t: Task) => t.status === TaskStatus.IN_PROGRESS).length || 0;
  const todoTasks = tasks?.filter((t: Task) => t.status === TaskStatus.TODO).length || 0;
  const totalMinutes = tasks?.reduce((sum: number, task: Task) => sum + task.total_minutes, 0) || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgTimePerTask = totalTasks > 0 ? Math.round(totalMinutes / totalTasks) : 0;

  // Calculate productivity metrics
  const completedTasksMinutes = tasks?.filter((t: Task) => t.status === TaskStatus.DONE)
    .reduce((sum: number, task: Task) => sum + task.total_minutes, 0) || 0;
  const avgCompletionTime = completedTasks > 0 ? Math.round(completedTasksMinutes / completedTasks) : 0;

  // Recent activity (last 7 days)
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const recentTasks = tasks?.filter((task: Task) => new Date(task.updated_at) >= weekAgo) || [];

  const metrics = [
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: BarChart3,
      color: 'bg-primary-100 text-primary-600',
      bgColor: 'bg-primary-50'
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      color: 'bg-success-100 text-success-600',
      bgColor: 'bg-success-50'
    },
    {
      title: 'Total Hours',
      value: `${Math.round(totalMinutes / 60)}h`,
      icon: Clock,
      color: 'bg-accent-100 text-accent-600',
      bgColor: 'bg-accent-50'
    },
    {
      title: 'Avg per Task',
      value: `${avgTimePerTask}m`,
      icon: Activity,
      color: 'bg-warning-100 text-warning-600',
      bgColor: 'bg-warning-50'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">
              Insights into your productivity and task management
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar size={16} />
            <span>Data as of {format(new Date(), 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric, index) => (
          <div key={index} className="card-hover group">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-1">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-xl group-hover:scale-110 transition-transform ${metric.color}`}>
                  <metric.icon className="h-7 w-7" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Task Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Task Status Distribution
            </h3>
          </div>
          <div className="card-body space-y-4">
            {[
              { label: 'Completed', count: completedTasks, color: 'bg-success-500', total: totalTasks },
              { label: 'In Progress', count: inProgressTasks, color: 'bg-primary-500', total: totalTasks },
              { label: 'Todo', count: todoTasks, color: 'bg-gray-400', total: totalTasks }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${totalTasks > 0 ? (item.count / totalTasks) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Productivity Insights
            </h3>
          </div>
          <div className="card-body space-y-6">
            <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg">
              <div className="flex items-center justify-center w-16 h-16 bg-primary-200 rounded-full mx-auto mb-4">
                <Clock className="h-8 w-8 text-primary-600" />
              </div>
              <p className="text-2xl font-bold text-primary-900">{avgCompletionTime}m</p>
              <p className="text-sm text-primary-700">Average completion time</p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasks this week</span>
                <span className="text-sm font-semibold text-gray-900">{recentTasks.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total time logged</span>
                <span className="text-sm font-semibold text-gray-900">{Math.round(totalMinutes / 60)}h {totalMinutes % 60}m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Most productive day</span>
                <span className="text-sm font-semibold text-gray-900">
                  {recentTasks.length > 0 ? 'This week' : 'No data'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Tips */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">💡 Performance Tips</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Productivity Insights</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Your completion rate is {completionRate}% - {completionRate >= 70 ? 'excellent!' : 'keep pushing!'}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Average {avgTimePerTask} minutes per task shows good time management</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>You have {inProgressTasks} tasks in progress - try to focus on completing them</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Recommendations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span className="text-success-500 mt-1">•</span>
                  <span>Break large tasks into smaller, manageable chunks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-success-500 mt-1">•</span>
                  <span>Use time blocking to dedicate focused time to high-priority tasks</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-success-500 mt-1">•</span>
                  <span>Log time consistently to get better estimates for future tasks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Time Chart */}
      <DailyTimeChart tasks={tasks || []} showAllUsers={false} />
    </div>
  );
};

export default Analytics;
