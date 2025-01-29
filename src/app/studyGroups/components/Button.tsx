import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
}

export function Button({ variant = 'default', children, className = '', ...props }: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors';
  const variantStyles = {
    default: 'bg-blue-500 text-white hover:bg-blue-600',
    destructive: 'bg-red-500 text-white hover:bg-red-600'
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
} 