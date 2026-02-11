import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from "react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
}

export function Button({ title, loading, variant = "primary", disabled, style, ...props }: ButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[{
        height: 56,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: variant === "primary" ? (loading ? colors.surfaceActive : colors.primary) : "transparent",
        shadowColor: variant === "primary" ? colors.primary : "transparent",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: variant === "primary" ? 0.2 : 0,
        shadowRadius: 8,
        elevation: variant === "primary" ? 4 : 0,
        borderWidth: variant === "outline" ? 1 : 0,
        borderColor: colors.border
      }, style]}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : colors.primary} />
      ) : (
        <Text style={{ 
          color: variant === "primary" ? '#ffffff' : colors.primary, 
          fontWeight: 'bold', 
          fontSize: 12, 
          textTransform: 'uppercase', 
          letterSpacing: 1.5 
        }}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
