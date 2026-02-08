import { Stack } from "expo-router";

export default function NewLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#020617" },
        animation: "slide_from_bottom",
      }}
    />
  );
}
