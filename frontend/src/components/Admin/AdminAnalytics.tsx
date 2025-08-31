// Admin analytics page with multi-user insights

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Clock, Activity, BarChart3 } from 'lucide-react';
import DailyTimeChart from '../Analytics/DailyTimeChart';

import { apiClient } from '../../lib';
import type { User, Task } from '../../types';

const AdminAnalytics: React.FC = () => {

  const { data: allTasks, isLoading: tasksLoading } = useQuery({
    queryKey: ['admin', 'all-tasks'],
    queryFn: () => apiClient.getAllTasks(),
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'all-users'],
    queryFn: () => apiClient.getAllUsers(),
  });

  if (tasksLoading || usersLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="loading-spinner h-12 w-12 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading team analytics...</p>
      </div>
    );
  }

  if (!allTasks || !allUsers) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Failed to load team analytics. Please try again.</p>
      </div>
    );
  }

  // Calculate team statistics
  const totalTasks = allTasks.length;
  const totalUsers = allUsers.length;
  const totalMinutes = allTasks.reduce((sum: number, task: Task) => sum + task.total_minutes, 0);
  const activeUsers = allUsers.filter((user: User) => 
    allTasks.some((task: Task) => (task.assigned_to || task.user_id) === user.id && task.total_minutes > 0)
  ).length;

  // User productivity stats
  const userStats = allUsers.map((user: User) => {
    const userTasks = allTasks.filter((task: Task) => 
      (task.assigned_to || task.user_id) === user.id
    );
    const userMinutes = userTasks.reduce((sum: number, task: Task) => sum + task.total_minutes, 0);
    const completedTasks = userTasks.filter((task: Task) => task.status === 'DONE').length;
    
    return {
      user,
      totalTasks: userTasks.length,
      totalMinutes: userMinutes,
      completedTasks,
      completionRate: userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0,
    };
  }).sort((a: { totalMinutes: number }, b: { totalMinutes: number }) => b.totalMinutes - a.totalMinutes);

  const topUsers = userStats.slice(0, 5);

  return (
    <div className="space-y-8">

      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
                <p className="text-xs text-success-600 mt-1 font-medium">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 bg-success-400 rounded-full mr-2 animate-pulse"></span>
                    {activeUsers} active
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
                <p className="text-xs text-success-600 mt-1 font-medium">
                  {Math.round((allTasks.filter((t: Task) => t.status === 'DONE').length / totalTasks) * 100)}% completed
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
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(totalMinutes / 60)}h
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  {Math.round(totalMinutes / totalUsers / 60)}h avg/user
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
                <p className="text-3xl font-bold text-gray-900">
                  {totalTasks > 0 ? Math.round(totalMinutes / totalTasks) : 0}m
                </p>
                <p className="text-xs text-gray-600 mt-1 font-medium">Team average</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-8 w-8 text-warning-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Users Leaderboard */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Top Contributors
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Users ranked by total time logged
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {topUsers.map((userStat: {
              user: User;
              totalTasks: number;
              totalMinutes: number;
              completedTasks: number;
              completionRate: number;
            }, index: number) => (
              <div
                key={userStat.user.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold shadow-sm">
                    #{index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {userStat.user.full_name}
                    </h4>
                    <div className="flex items-center mt-1">
                      <p className="text-sm text-gray-600">
                        {userStat.user.email}
                      </p>
                      {userStat.user.is_admin && (
                        <span className="ml-2 badge-primary">
                          Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {Math.round(userStat.totalMinutes / 60)}h {userStat.totalMinutes % 60}m
                  </div>
                  <div className="text-sm text-gray-600">
                    {userStat.totalTasks} tasks · {Math.round(userStat.completionRate)}% done
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Daily Time Chart */}
      <DailyTimeChart 
        tasks={allTasks || []} 
        users={allUsers || []}
        showAllUsers={true} 
      />
    </div>
  );
};

export default AdminAnalytics;
