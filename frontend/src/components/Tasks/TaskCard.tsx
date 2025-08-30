import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit, Trash2, Play, Pause, CheckCircle, MoreVertical, Calendar, Timer, Plus } from 'lucide-react';
import { TaskStatus } from '../../types';
import type { Task } from '../../types';
import { useUpdateTaskStatus, useDeleteTask, useAddTimeToTask } from '../../hooks/useTasks';
import { format } from 'date-fns';
import DeleteConfirmationModal from '../Layout/DeleteConfirmationModal';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
}

// Enhanced task card component with improved accessibility and UX
const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [timeInput, setTimeInput] = useState(''); // shorter name
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuPos, setMenuPos] = useState({ left: 0, top: 0 }); // casual naming
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null); // shorter

  useEffect(() => {
    if (showMenu && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuWidth = 160; 
      const menuHeight = 120;
      
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // TODO: This positioning logic could be cleaner
      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }
      if (left < 8) left = 8;
      
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }
      
      setMenuPos({ left, top });
    }
  }, [showMenu]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        btnRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const updateStatus = useUpdateTaskStatus();
  const deleteTask = useDeleteTask();
  const addTime = useAddTimeToTask();

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'task-status-todo';
      case TaskStatus.IN_PROGRESS:
        return 'task-status-in-progress';
      case TaskStatus.DONE:
        return 'task-status-done';
      default:
        return 'task-status-todo';
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return <Play size={16} />;
      case TaskStatus.IN_PROGRESS:
        return <Pause size={16} />;
      case TaskStatus.DONE:
        return <CheckCircle size={16} />;
      default:
        return <Play size={16} />;
    }
  };

  const getNextStatus = (currentStatus: TaskStatus): TaskStatus => {
    switch (currentStatus) {
      case TaskStatus.TODO:
        return TaskStatus.IN_PROGRESS;
      case TaskStatus.IN_PROGRESS:
        return TaskStatus.DONE;
      case TaskStatus.DONE:
        return TaskStatus.TODO;
      default:
        return TaskStatus.IN_PROGRESS;
    }
  };

  const handleStatusChange = () => {
    const nextStatus = getNextStatus(task.status);
    // console.log('status change', task.id, nextStatus); // quick debug
    updateStatus.mutate({ id: task.id, status: nextStatus });
  };

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowMenu(false);
    setTimeout(() => setShowDeleteModal(true), 10); // prevent flicker
  };

  const handleConfirmDelete = () => {
    deleteTask.mutate(task.id);
    setShowDeleteModal(false);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  const handleAddTime = () => {
    const minutes = parseInt(timeInput);
    if (minutes > 0) {
      addTime.mutate({ id: task.id, minutes });
      setTimeInput('');
      setShowTimeInput(false);
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

  return (
    <div className="card-hover group overflow-hidden relative">
      <div className="card-body">
        {/* Header with Status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className={`${getStatusColor(task.status)} px-3 py-1 text-xs font-medium flex items-center space-x-1`}>
              {getStatusIcon(task.status)}
              <span className="capitalize">{task.status.replace('_', ' ').toLowerCase()}</span>
            </span>
            
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Calendar size={12} />
              <span>{format(new Date(task.created_at), 'MMM d')}</span>
            </div>
          </div>
          
          <div className="relative">
            <button
              ref={btnRef}
              onClick={() => setShowMenu(!showMenu)}
              className="btn-ghost p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical size={16} />
            </button>
          </div>
        </div>

        {/* Task Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-3 leading-tight line-clamp-2 group-hover:text-primary-700 transition-all duration-300 cursor-pointer text-balance">
          {task.title}
        </h3>
        
        {/* Description */}
        {task.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
            {task.description}
          </p>
        )}


        
        {/* Time Tracking Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Timer size={14} className="text-primary-500" />
                <span className="font-medium">{formatDuration(task.total_minutes)}</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-xs">logged</span>
            </div>
            
            {!showTimeInput && (
              <button
                onClick={() => setShowTimeInput(true)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus size={12} />
                <span>Add time</span>
              </button>
            )}
          </div>
          
          {showTimeInput && (
            <div className="bg-gray-50 rounded-lg p-3 animate-slide-up">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Minutes"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="input text-sm py-1.5 px-2 flex-1"
                  min="1"
                  max="480"
                  autoFocus
                />
                <button
                  onClick={handleAddTime}
                  className="btn-primary btn-sm"
                  disabled={!timeInput || addTime.isPending}
                >
                  {addTime.isPending ? 'Adding...' : 'Add'}
                </button>
                <button
                  onClick={() => {
                    setShowTimeInput(false);
                    setTimeInput('');
                  }}
                  className="btn-outline btn-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleStatusChange}
              disabled={updateStatus.isPending}
              className={`btn-sm transition-all ${
                task.status === TaskStatus.DONE 
                  ? 'btn-outline' 
                  : 'btn-primary'
              }`}
            >
              {updateStatus.isPending ? (
                <div className="loading-spinner h-3 w-3 mr-1"></div>
              ) : (
                getStatusIcon(task.status)
              )}
              <span className="ml-1">
                {task.status === TaskStatus.DONE 
                  ? 'Reopen' 
                  : task.status === TaskStatus.TODO 
                    ? 'Start' 
                    : 'Complete'
                }
              </span>
            </button>
          </div>
          
          <button
            onClick={() => onEdit(task)}
            className="btn-ghost btn-sm opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit size={14} className="mr-1" />
            Edit
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        taskTitle={task.title}
        isDeleting={deleteTask.isPending}
      />

      {/* Dropdown Menu Portal */}
      {showMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed w-40 bg-white rounded-xl shadow-lg ring-1 ring-black/5 z-50 animate-scale-in"
          style={{
            left: menuPos.left,
            top: menuPos.top,
          }}
        >
          <div className="p-2">
            <button
              onClick={() => {
                onEdit(task);
                setShowMenu(false);
              }}
              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Edit size={14} className="mr-3 text-gray-400" />
              Edit Task
            </button>
            <button
              onClick={(e) => handleDelete(e)}
              className="flex items-center w-full px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} className="mr-3" />
              Delete
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TaskCard;
