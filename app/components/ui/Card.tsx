import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface CardProps extends ViewProps {
  padding?: number;
  glass?: boolean;
}

export function Card({ children, padding = 16, glass = false, style, ...props }: CardProps) {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: glass ? (isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.7)') : colors.surface,
          borderRadius: 24,
          padding,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.05,
          shadowRadius: 12,
          elevation: glass ? 0 : 4,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
