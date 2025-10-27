import React from 'react';
import { Card } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function StatCard({ title, value, description, variant = 'default' }: StatCardProps) {
  const variantClasses = {
    default: 'bg-secondary/50 border-primary/20',
    success: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    destructive: 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
  };

  const textClasses = {
    default: 'text-primary',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
    destructive: 'text-red-700 dark:text-red-400',
  };

  return (
    <Card className={`p-6 border-2 ${variantClasses[variant]}`}>
      <p className="text-sm font-semibold text-muted-foreground">{title}</p>
      <p className={`text-3xl font-bold mt-2 ${textClasses[variant]}`}>{value}</p>
      {description && (
        <p className="text-xs mt-2 text-muted-foreground">{description}</p>
      )}
    </Card>
  );
}
