// Daily time logging chart component

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import type { Task, User } from '../../types';
import { Clock, TrendingUp, Calendar } from 'lucide-react';

interface DailyTimeData {
  date: string;
  displayDate: string;
  totalMinutes: number;
  taskCount: number;
  users?: UserDayData[];
}

interface UserDayData {
  userId: string;
  userName: string;
  minutes: number;
  taskCount: number;
}

interface DailyTimeChartProps {
  tasks: Task[];
  users?: User[];
  showAllUsers?: boolean;
}

const DailyTimeChart: React.FC<DailyTimeChartProps> = ({
  tasks,
  users = [],
  showAllUsers = false,
}) => {
  // Generate chart data for the last 14 days
  const endDate = new Date();
  const startDate = subDays(endDate, 13);
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  const chartData: DailyTimeData[] = dates.map((date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter tasks updated on this day
    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.updated_at);
      return taskDate >= dayStart && taskDate <= dayEnd && task.total_minutes > 0;
    });

    let userData: UserDayData[] = [];
    let totalMinutes = 0;

    if (showAllUsers && users.length > 0) {
      // Group by user for admin view
      const userMinutes = new Map<string, { minutes: number; taskCount: number }>();
      
      dayTasks.forEach((task) => {
        const userId = task.assigned_to || task.user_id;
        const current = userMinutes.get(userId) || { minutes: 0, taskCount: 0 };
        userMinutes.set(userId, {
          minutes: current.minutes + task.total_minutes,
          taskCount: current.taskCount + 1,
        });
      });

      userData = Array.from(userMinutes.entries()).map(([userId, data]) => {
        const user = users.find((u) => u.id === userId);
        return {
          userId,
          userName: user?.full_name || 'Unknown User',
          minutes: data.minutes,
          taskCount: data.taskCount,
        };
      });

      totalMinutes = userData.reduce((sum, user) => sum + user.minutes, 0);
    } else {
      totalMinutes = dayTasks.reduce((sum, task) => sum + task.total_minutes, 0);
    }

    return {
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'MMM dd'),
      totalMinutes: totalMinutes,
      taskCount: dayTasks.length,
      users: userData,
    };
  });

  const totalHours = chartData.reduce((sum, d) => sum + d.totalMinutes, 0) / 60;
  const avgDailyHours = totalHours / chartData.length;

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes('Minutes') || name.includes('Time')) {
      const hours = Math.floor(value / 60);
      const minutes = value % 60;
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    }
    return value;
  };

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
    if (!active || !payload || !payload.length) return null;

    const payloadItem = payload[0] as { payload?: DailyTimeData } | undefined;
    const data = payloadItem?.payload as DailyTimeData | undefined;
    if (!data) return null;
    
    return (
      <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-900 mb-2">{data.displayDate}</p>
        <div className="space-y-1">
          <p className="text-sm">
            <span className="text-gray-600">Total Time: </span>
            <span className="font-medium text-primary-600">
              {formatTooltipValue(data.totalMinutes, 'time')}
            </span>
          </p>
          <p className="text-sm">
            <span className="text-gray-600">Tasks: </span>
            <span className="font-medium">{data.taskCount}</span>
          </p>
          
          {showAllUsers && data.users && data.users.length > 0 && (
            <div className="mt-3 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-700 mb-1">By User:</p>
              {[...data.users]
                .sort((a, b) => b.minutes - a.minutes)
                .slice(0, 5)
                .map((user) => (
                  <p key={user.userId} className="text-xs text-gray-600">
                    {user.userName}: {formatTooltipValue(user.minutes, 'time')}
                  </p>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total (14 days)</p>
                <p className="text-3xl font-bold text-gray-900">{Math.round(totalHours)}h</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Daily Average</p>
                <p className="text-3xl font-bold text-gray-900">{avgDailyHours.toFixed(1)}h</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-success-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Active Days</p>
                <p className="text-3xl font-bold text-gray-900">{chartData.filter(d => d.totalMinutes > 0).length}</p>
              </div>
              <div className="p-3 bg-warning-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-warning-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">
            Daily Time Logged {showAllUsers ? '(All Users)' : ''}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Time logged per day over the last 14 days
          </p>
        </div>
        <div className="card-body">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {showAllUsers ? (
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(229 231 235)" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                    tickLine={{ stroke: 'rgb(203 213 225)' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                    tickLine={{ stroke: 'rgb(203 213 225)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="totalMinutes"
                    fill="rgb(59 130 246)"
                    radius={[4, 4, 0, 0]}
                    name="Total Time"
                  />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(229 231 235)" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                    tickLine={{ stroke: 'rgb(203 213 225)' }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${Math.round(value / 60)}h`}
                    tick={{ fontSize: 12, fill: 'rgb(100 116 139)' }}
                    tickLine={{ stroke: 'rgb(203 213 225)' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="totalMinutes"
                    stroke="rgb(59 130 246)"
                    strokeWidth={3}
                    dot={{ fill: 'rgb(59 130 246)', strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: 'rgb(59 130 246)', stroke: 'rgb(255 255 255)', strokeWidth: 3 }}
                    name="Time Logged"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyTimeChart;
