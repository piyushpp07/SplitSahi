import { useEffect } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/authStore";

export default function Index() {
  const { hydrated, token } = useAuthStore();

  if (!hydrated) {
    return (
      <View className="flex-1 bg-surface-dark items-center justify-center">
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text className="text-slate-300 mt-4">Loading...</Text>
      </View>
    );
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
