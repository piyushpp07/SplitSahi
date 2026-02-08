import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// Configure notifications (Commented out for Expo Go compatibility)
/*
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
*/

export default function RootLayout() {
  const { hydrate } = useAuthStore();
  const colorScheme = useColorScheme();
  
  // Removed useFonts hook as asset file is missing causing Android crash
    
  useEffect(() => {
    hydrate();
    SplashScreen.hideAsync(); // Hide splash immediately since no fonts to wait for
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#020617" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#020617" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="expense/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="friend/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="preferences" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
