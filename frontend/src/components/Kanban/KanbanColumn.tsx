// Kanban column component for task organization

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskStatus, type Task } from '../../types';
import KanbanTaskCard from './KanbanTaskCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
  bgColor: string;
  count: number;
  onEditTask: (task: Task) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  color,
  bgColor,
  count,
  onEditTask,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div className={`card-header ${bgColor} border-l-4 ${color}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className={`badge badge-gray`}>
              {count}
            </span>
          </div>
        </div>
      </div>

      {/* Drop Zone */}
      <div
        ref={setNodeRef}
        className={`
          flex-1 p-4 min-h-[500px] transition-colors duration-200
          ${isOver ? 'bg-primary-50 ring-2 ring-primary-300 ring-inset' : 'bg-gray-50/50'}
        `}
      >
        <SortableContext
          items={tasks.map(task => task.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm font-medium">No tasks yet</p>
                <p className="text-gray-400 text-xs mt-1">
                  {id === TaskStatus.TODO && 'Create a new task to get started'}
                  {id === TaskStatus.IN_PROGRESS && 'Move tasks here when you start working on them'}
                  {id === TaskStatus.DONE && 'Completed tasks will appear here'}
                </p>
              </div>
            ) : (
              tasks.map((task, index) => (
                <div
                  key={task.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <KanbanTaskCard
                    task={task}
                    onEdit={onEditTask}
                  />
                </div>
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
