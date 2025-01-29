import React from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
}

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DialogContent({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = '' }: DialogContentProps) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = '' }: DialogContentProps) {
  return (
    <h2 className={`text-lg font-semibold ${className}`}>
      {children}
    </h2>
  );
}

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  onClick?: () => void;
}

export function DialogTrigger({ children, onClick }: DialogTriggerProps) {
  return (
    <div onClick={onClick}>
      {children}
    </div>
  );
} 