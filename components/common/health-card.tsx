import React, { ReactNode } from 'react';
import { View, ViewProps } from 'react-native';

interface HealthCardProps extends ViewProps {
  children: ReactNode;
  className?: string;
}

export default function HealthCard({ children, className = "", style, ...props }: HealthCardProps) {
  return (
    <View 
      className={`rounded-2xl bg-card shadow-sm border border-border ${className}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
}