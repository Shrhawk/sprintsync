// Reusable dropdown component with modern styling and accessibility

import React, { useState, useRef, useEffect, type ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  description?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  showCheck?: boolean;
  position?: 'bottom' | 'top';
}

const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  disabled = false,
  className = '',
  error = false,
  searchable = false,
  clearable = false,
  showCheck = true,
  position = 'bottom',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          break;
        case 'ArrowUp':
        case 'ArrowDown':
          event.preventDefault();
          // TODO: Implement keyboard navigation between options
          break;
        case 'Enter':
          event.preventDefault();
          // TODO: Select highlighted option
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  const getMenuPositionClasses = () => {
    return position === 'top' 
      ? 'bottom-full mb-2' 
      : 'top-full mt-2';
  };

  return (
    <div ref={dropdownRef} className={`dropdown ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          dropdown-trigger
          ${isOpen ? 'dropdown-trigger-open' : ''}
          ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${disabled ? 'bg-gray-50 cursor-not-allowed' : ''}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 dropdown-icon">
              {selectedOption.icon}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <span className={`block truncate ${
              selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'
            }`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.description && (
              <span className="block truncate text-xs text-gray-400 mt-0.5 leading-tight">
                {selectedOption.description}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 flex-shrink-0">
          {clearable && selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-red-500 transition-all duration-200"
              aria-label="Clear selection"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 5.293L8.646 2.646a.5.5 0 01.708.708L6.707 6l2.647 2.646a.5.5 0 01-.708.708L6 6.707 3.354 9.354a.5.5 0 01-.708-.708L5.293 6 2.646 3.354a.5.5 0 01.708-.708L6 5.293z"/>
              </svg>
            </button>
          )}
          <ChevronDown size={18} className="dropdown-chevron" />
        </div>
      </button>

      {/* Dropdown Menu */}
      <div
        className={`
          dropdown-menu ${getMenuPositionClasses()}
          ${isOpen ? 'dropdown-menu-open' : ''}
        `}
        role="listbox"
      >
        {searchable && (
          <div className="dropdown-search">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search options..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className="dropdown-menu-content">
          {filteredOptions.length === 0 ? (
            <div className="dropdown-empty">
              <div className="flex flex-col items-center space-y-2">
                <span className="text-2xl opacity-50">
                  {searchTerm ? '🔍' : '📭'}
                </span>
                <span className="font-medium">
                  {searchTerm ? 'No matches found' : 'No options available'}
                </span>
                {searchTerm && (
                  <span className="text-xs text-gray-400">
                    Try a different search term
                  </span>
                )}
              </div>
            </div>
          ) : (
            filteredOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => !option.disabled && handleSelect(option.value)}
                disabled={option.disabled}
                className={`
                  dropdown-item w-full text-left group
                  ${value === option.value ? 'dropdown-item-selected' : ''}
                  ${option.disabled ? 'opacity-40 cursor-not-allowed' : ''}
                `}
                role="option"
                aria-selected={value === option.value}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {option.icon && (
                    <span className={`flex-shrink-0 dropdown-icon ${
                      value === option.value ? 'text-primary-600' : ''
                    }`}>
                      {option.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium leading-tight">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-gray-500 truncate mt-1 group-hover:text-gray-600 transition-colors leading-tight">
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {showCheck && value === option.value && (
                  <Check size={16} className="flex-shrink-0 text-primary-600" />
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dropdown;
