import { View, TextInput, TextInputProps, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import { forwardRef } from "react";

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  error?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<TextInput, InputProps>(({ icon, error, rightElement, style, ...props }, ref) => {
  const { colors } = useTheme();

  return (
    <View style={{ 
      backgroundColor: colors.surface, 
      borderRadius: 20, 
      borderWidth: 1, 
      borderColor: error ? colors.error : colors.border, 
      padding: 4, 
      flexDirection: 'row', 
      alignItems: 'center',
      marginBottom: 0
    }}>
      {icon && (
        <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
          <Ionicons name={icon} size={18} color={error ? colors.error : (props.value ? colors.primary : colors.textTertiary)} />
        </View>
      )}
      <TextInput
        ref={ref}
        style={[{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }, style]}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {rightElement && (
        <View style={{ marginRight: 12 }}>
          {rightElement}
        </View>
      )}
    </View>
  );
});

Input.displayName = "Input";
