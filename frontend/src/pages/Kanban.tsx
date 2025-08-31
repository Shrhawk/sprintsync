// Kanban board with drag-and-drop functionality

import React, { useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { Plus, BarChart3, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { TaskStatus } from '../types';
import type { Task } from '../types';
import { useTasks, useUpdateTaskStatus } from '../hooks/useTasks';
import KanbanColumn from '../components/Kanban/KanbanColumn';
import KanbanTaskCard from '../components/Kanban/KanbanTaskCard';
import TaskForm from '../components/Tasks/TaskForm';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

const Kanban: React.FC = () => {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const { data: tasks, isLoading, error } = useTasks();
  const updateStatusMutation = useUpdateTaskStatus();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Organize tasks by status
  const tasksByStatus = useMemo(() => {
    if (!tasks) return { TODO: [], IN_PROGRESS: [], DONE: [] };

    return {
      TODO: tasks.filter((task: Task) => task.status === TaskStatus.TODO),
      IN_PROGRESS: tasks.filter((task: Task) => task.status === TaskStatus.IN_PROGRESS),
      DONE: tasks.filter((task: Task) => task.status === TaskStatus.DONE),
    };
  }, [tasks]);

  const columns = [
    {
      id: TaskStatus.TODO,
      title: 'To Do',
      tasks: tasksByStatus.TODO,
      color: 'border-gray-300',
      bgColor: 'bg-gray-50',
      count: tasksByStatus.TODO.length,
    },
    {
      id: TaskStatus.IN_PROGRESS,
      title: 'In Progress',
      tasks: tasksByStatus.IN_PROGRESS,
      color: 'border-primary-300',
      bgColor: 'bg-primary-50',
      count: tasksByStatus.IN_PROGRESS.length,
    },
    {
      id: TaskStatus.DONE,
      title: 'Done',
      tasks: tasksByStatus.DONE,
      color: 'border-success-300',
      bgColor: 'bg-success-50',
      count: tasksByStatus.DONE.length,
    },
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks?.find((t: Task) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    const task = tasks?.find((t: Task) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistically update the UI
    updateStatusMutation.mutate(
      { id: taskId, status: newStatus },
      {
        onSuccess: () => {
          toast.success(`Task moved to ${newStatus.replace('_', ' ').toLowerCase()}!`);
        },
        onError: () => {
          toast.error('Failed to update task status');
        },
      }
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const taskStats = useMemo(() => {
    if (!tasks) return { total: 0, totalMinutes: 0, completionRate: 0 };

    const total = tasks.length;
    const completed = tasksByStatus.DONE.length;
    const totalMinutes = tasks.reduce((sum: number, task: Task) => sum + task.total_minutes, 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, totalMinutes, completionRate };
  }, [tasks, tasksByStatus]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 animate-fade-in">
        <div className="loading-spinner h-12 w-12 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading kanban board...</p>
        <p className="text-gray-500 text-sm mt-1">Organizing your tasks</p>
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">
            Drag and drop tasks between columns to update their status
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowTaskForm(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.total}</p>
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
                <p className="text-sm font-semibold text-gray-600 mb-1">In Progress</p>
                <p className="text-3xl font-bold text-gray-900">{tasksByStatus.IN_PROGRESS.length}</p>
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
                <p className="text-3xl font-bold text-gray-900">{tasksByStatus.DONE.length}</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-7 w-7 text-success-600" />
              </div>
            </div>
          </div>
        </div>
        
        <div className="card-hover group">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-1">Completion Rate</p>
                <p className="text-3xl font-bold text-gray-900">{taskStats.completionRate}%</p>
              </div>
              <div className="p-3 bg-success-100 rounded-xl group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-success-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={column.tasks}
              color={column.color}
              bgColor={column.bgColor}
              count={column.count}
              onEditTask={handleEditTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="rotate-3 opacity-90">
              <KanbanTaskCard task={activeTask} onEdit={() => {}} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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

export default Kanban;
