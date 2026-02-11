import React from 'react';
import { Text, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface TypographyProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption' | 'label';
  color?: 'primary' | 'secondary' | 'muted' | 'error' | 'success' | 'text';
  weight?: 'normal' | 'medium' | 'bold' | 'semibold';
  align?: 'auto' | 'left' | 'center' | 'right' | 'justify';
}

export function Typography({ 
  variant = 'body1', 
  color = 'text', 
  weight, 
  align = 'left',
  style, 
  children, 
  ...props 
}: TypographyProps) {
  const { colors } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'h1': return { fontSize: 32, fontWeight: '800', letterSpacing: -1 };
      case 'h2': return { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 };
      case 'h3': return { fontSize: 20, fontWeight: '600' };
      case 'body1': return { fontSize: 16, lineHeight: 24 };
      case 'body2': return { fontSize: 14, lineHeight: 20 };
      case 'caption': return { fontSize: 12, lineHeight: 16 };
      case 'label': return { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 };
      default: return {};
    }
  };

  const getColor = () => {
    switch (color) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.textSecondary;
      case 'muted': return colors.textMuted;
      case 'error': return colors.error;
      case 'success': return colors.success;
      case 'text': return colors.text;
      default: return colors.text;
    }
  };

  return (
    <Text
      style={[
        getVariantStyle(),
        {
          color: getColor(),
          textAlign: align,
          fontWeight: weight || (getVariantStyle().fontWeight as any),
        },
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}
