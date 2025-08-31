// Draggable task card for Kanban board

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Clock, 
  Calendar, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Plus,
  GripVertical
} from 'lucide-react';
import { TaskStatus, type Task } from '../../types';
import { useDeleteTask, useAddTimeToTask } from '../../hooks/useTasks';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import DeleteConfirmationModal from '../Layout/DeleteConfirmationModal';

interface KanbanTaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  isDragging?: boolean;
}

const KanbanTaskCard: React.FC<KanbanTaskCardProps> = ({ 
  task, 
  onEdit,
  isDragging = false 
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showTimeInput, setShowTimeInput] = useState(false);
  const [timeToAdd, setTimeToAdd] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ left: 0, top: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const deleteTaskMutation = useDeleteTask();
  const addTimeMutation = useAddTimeToTask();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Calculate menu position when it opens
  useEffect(() => {
    if (showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const menuWidth = 144; // w-36 = 144px
      const menuHeight = 120; // approximate height
      
      let left = rect.left;
      let top = rect.bottom + 8;
      
      // Check if menu would go off right edge of screen
      if (left + menuWidth > window.innerWidth) {
        left = rect.right - menuWidth;
      }
      
      // Check if menu would go off left edge
      if (left < 8) {
        left = 8;
      }
      
      // Check if menu would go off bottom of screen
      if (top + menuHeight > window.innerHeight) {
        top = rect.top - menuHeight - 8;
      }
      
      setMenuPosition({ left, top });
    }
  }, [showMenu]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  const handleDelete = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setShowMenu(false);
    // Use a small delay to prevent flickering
    setTimeout(() => {
      setShowDeleteModal(true);
    }, 10);
  };

  const handleConfirmDelete = () => {
    deleteTaskMutation.mutate(task.id);
    setShowDeleteModal(false);
  };

  const handleCloseModal = () => {
    setShowDeleteModal(false);
  };

  const handleAddTime = () => {
    const minutes = parseInt(timeToAdd);
    if (minutes > 0) {
      addTimeMutation.mutate({ id: task.id, minutes });
      setTimeToAdd('');
      setShowTimeInput(false);
      toast.success(`Added ${minutes} minutes to task`);
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

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'border-l-gray-400';
      case TaskStatus.IN_PROGRESS:
        return 'border-l-primary-500';
      case TaskStatus.DONE:
        return 'border-l-success-500';
      default:
        return 'border-l-gray-400';
    }
  };

  // Don't show drag handle and menu when dragging
  const showControls = !isDragging && !isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        card border-l-4 ${getStatusColor(task.status)} 
        ${isSortableDragging ? 'opacity-50' : 'hover:shadow-md'} 
        ${isDragging ? 'shadow-xl' : ''} 
        transition-all duration-200 cursor-pointer group relative
        ${showTimeInput ? 'ring-2 ring-primary-500' : ''}
      `}
      {...attributes}
    >
      <div className="card-body p-4">
        {/* Drag Handle and Menu */}
        {showControls && (
          <div className="absolute top-2 right-2 flex items-center space-x-1">
            <button
              {...listeners}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing transition-opacity"
              aria-label="Drag to move task"
            >
              <GripVertical size={14} />
            </button>
            <div className="relative">
              <button
                ref={buttonRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-opacity"
              >
                <MoreVertical size={14} />
              </button>
              

            </div>
          </div>
        )}

        {/* Task Title */}
        <h4 className="font-semibold text-gray-900 mb-2 pr-12 leading-snug text-balance">
          {task.title}
        </h4>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}



        {/* Time Input */}
        {showTimeInput && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder="Minutes"
                value={timeToAdd}
                onChange={(e) => setTimeToAdd(e.target.value)}
                className="input text-sm flex-1"
                min="1"
                autoFocus
              />
              <button
                onClick={handleAddTime}
                disabled={!timeToAdd || parseInt(timeToAdd) <= 0}
                className="btn-primary btn-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowTimeInput(false)}
                className="btn-ghost btn-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Task Footer */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            {task.total_minutes > 0 && (
              <div className="flex items-center space-x-1">
                <Clock size={12} />
                <span className="font-medium">
                  {formatDuration(task.total_minutes)}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Calendar size={12} />
              <span>{format(new Date(task.updated_at), 'MMM d')}</span>
            </div>
          </div>
          
          {/* Priority Indicator (if we add priority later) */}
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status).replace('border-l-', 'bg-')}`}></div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleCloseModal}
        onConfirm={handleConfirmDelete}
        title="Delete Task"
        taskTitle={task.title}
        isDeleting={deleteTaskMutation.isPending}
      />

      {/* Dropdown Menu Portal */}
      {showMenu && createPortal(
        <div
          ref={menuRef}
          className="fixed w-36 bg-white rounded-lg shadow-lg ring-1 ring-black/5 z-50 animate-scale-in"
          style={{
            left: menuPosition.left,
            top: menuPosition.top,
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                onEdit(task);
                setShowMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={14} />
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                setShowTimeInput(!showTimeInput);
                setShowMenu(false);
              }}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Plus size={14} />
              <span>Add Time</span>
            </button>
            <button
              onClick={(e) => handleDelete(e)}
              className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default KanbanTaskCard;
