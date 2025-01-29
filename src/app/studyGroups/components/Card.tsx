import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }: CardProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }: CardProps) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '' }: CardProps) {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
} 