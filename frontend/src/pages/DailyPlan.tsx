// AI-powered daily plan page

import React from 'react';
import { RefreshCw, Clock, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useDailyPlan, useRefreshDailyPlan } from '../hooks/useAI';
import type { DailyPlanTask } from '../types';

const DailyPlan: React.FC = () => {
  const { data: plan, isLoading, refetch } = useDailyPlan();
  const refreshMutation = useRefreshDailyPlan();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    try {
      await refreshMutation.mutateAsync();
      // Invalidate and refetch the daily plan query
      await queryClient.invalidateQueries({ queryKey: ['daily-plan'] });
      refetch();
    } catch {
      // Error handling is done in the hook
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'badge-error';
      case 'medium':
        return 'badge-warning';
      case 'low':
        return 'badge-success';
      default:
        return 'badge-gray';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Daily Plan</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  // Error handling removed for now  
  // eslint-disable-next-line no-constant-condition
  if (false) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">Daily Plan</h1>
          <button
            onClick={handleRefresh}
            disabled={refreshMutation.isPending}
            className="btn-primary"
          >
            <RefreshCw size={20} className="mr-2" />
            Generate Plan
          </button>
        </div>
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load daily plan</h3>
          <p className="text-gray-500">Please try generating a new plan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Daily Plan</h1>
          <p className="page-subtitle">AI-powered task planning for today</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="btn-primary"
        >
          {refreshMutation.isPending ? (
            <>
              <RefreshCw size={20} className="mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw size={20} className="mr-2" />
              Refresh Plan
            </>
          )}
        </button>
      </div>

      {plan && (
        <>
          {/* Plan Summary */}
          <div className="card p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Today's Focus</h2>
              {plan.fallback && (
                <span className="badge-warning">
                  Fallback Mode
                </span>
              )}
            </div>
            <p className="text-gray-700 mb-4">{plan.plan_summary}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Clock size={16} />
                <span>Total estimated time: {formatDuration(plan.total_estimated_minutes)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle size={16} />
                <span>{plan.tasks.length} tasks planned</span>
              </div>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Recommended Tasks</h3>
            {plan.tasks.map((task: DailyPlanTask, index: number) => (
              <div key={index} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                        {index + 1}
                      </span>
                      <h4 className="text-lg font-medium text-gray-900">{task.title}</h4>
                      <span className={`${getPriorityColor(task.priority)}`}>
                        {task.priority} priority
                      </span>
                    </div>
                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3 ml-9">{task.description}</p>
                    )}
                    <div className="flex items-center space-x-4 text-sm text-gray-500 ml-9">
                      <div className="flex items-center space-x-1">
                        <Clock size={14} />
                        <span>Estimated: {formatDuration(task.estimated_minutes)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="card border-primary-200 bg-gradient-to-br from-primary-50 to-primary-100">
            <div className="card-body">
              <h4 className="text-sm font-semibold text-primary-900 mb-3 flex items-center">
                <span className="text-lg mr-2">💡</span> Productivity Tips
              </h4>
              <ul className="text-sm text-primary-800 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Take 5-minute breaks between tasks to stay focused</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Start with high-priority tasks when your energy is highest</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Log your time to track actual vs. estimated duration</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-primary-500 mt-1">•</span>
                  <span>Don't forget to celebrate completed tasks! 🎉</span>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DailyPlan;
