import React from "react";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "@/components/ui/Typography";

export default function Index() {
  const { hydrated, token } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkFirstLaunch() {
      try {
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        setIsFirstLaunch(hasLaunched === null);
      } catch (error) {
        setIsFirstLaunch(false);
      }
    }
    checkFirstLaunch();
  }, []);

  if (!hydrated || isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <LinearGradient
          colors={isDark ? [colors.background, colors.surface] : ['#ffffff', '#f8fafc']}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ 
            width: 80, height: 80, borderRadius: 24, 
            backgroundColor: colors.primary, 
            alignItems: 'center', justifyContent: 'center',
            shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3, shadowRadius: 20, elevation: 10,
            marginBottom: 24
          }}>
            <Typography variant="h1" style={{ color: '#fff', fontSize: 40 }}>S</Typography>
          </View>
          <Typography variant="h2" style={{ marginBottom: 40 }}>SahiSplit</Typography>
          <ActivityIndicator size="small" color={colors.primary} />
        </LinearGradient>
      </View>
    );
  }

  if (isFirstLaunch) return <Redirect href="/onboarding" />;
  if (token) return <Redirect href="/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}

