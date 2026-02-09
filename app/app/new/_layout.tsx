import { Stack } from "expo-router";
import { useTheme } from "@/contexts/ThemeContext";

export default function NewLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_bottom",
      }}
    />
  );
}
