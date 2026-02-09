import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";

export default function Index() {
  const { hydrated, token } = useAuthStore();
  const { colors } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        if (hasLaunched === null) {
          setIsFirstLaunch(true);
        } else {
          setIsFirstLaunch(false);
        }
      } catch (error) {
        setIsFirstLaunch(false); // Fallback
      }
    }
    checkFirstLaunch();
  }, []);

  if (!hydrated || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 16, color: colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  if (isFirstLaunch) {
    return <Redirect href="/onboarding" />;
  }

  if (token) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
