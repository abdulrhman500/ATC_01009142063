import React, { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  fullWidth = true,
  className,
  leftIcon,
  rightIcon,
  id,
  ...rest
}) => {
  const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;
  
  return (
    <div className={clsx('mb-4', fullWidth && 'w-full')}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-secondary mb-1">
          {label}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 rtl:right-0 rtl:left-auto flex items-center pl-3 rtl:pr-3 rtl:pl-0 pointer-events-none text-text-tertiary">
            {leftIcon}
          </div>
        )}
        
        <input
          id={inputId}
          className={clsx(
            'w-full px-3 py-2 rounded-md border bg-bg-primary text-text-primary placeholder:text-text-tertiary',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            error ? 'border-error-500' : 'border-border',
            leftIcon && 'pl-10 rtl:pr-10 rtl:pl-3',
            rightIcon && 'pr-10 rtl:pl-10 rtl:pr-3',
            className
          )}
          {...rest}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 rtl:left-0 rtl:right-auto flex items-center pr-3 rtl:pl-3 rtl:pr-0">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
};

export default Input;