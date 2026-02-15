import React from "react";
import { View, ActivityIndicator, StatusBar, Alert, TouchableOpacity } from "react-native";
import { Redirect } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "@/contexts/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "@/components/ui/Typography";
import { Ionicons } from "@expo/vector-icons";

const BIOMETRIC_KEY = "splitsahise_biometric_enabled";

export default function Index() {
  const { hydrated, token } = useAuthStore();
  const { colors, isDark } = useTheme();
  const [isFirstLaunch, setIsFirstLaunch] = React.useState<boolean | null>(null);
  const [isUnlocked, setIsUnlocked] = React.useState(false);
  const [checkingBiometric, setCheckingBiometric] = React.useState(true);
  const [biometricType, setBiometricType] = React.useState<string>("Biometric");

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

  React.useEffect(() => {
    if (hydrated && token) {
      handleBiometricAuth();
    } else if (hydrated) {
      setCheckingBiometric(false);
    }
  }, [hydrated, token]);

  async function handleBiometricAuth() {
    try {
      const isEnabled = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      
      if (isEnabled === "true") {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();

        if (compatible && enrolled) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType("Face ID");
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType("Fingerprint");
          }

          const result = await LocalAuthentication.authenticateAsync({
            promptMessage: "Unlock SplitItUp",
            fallbackLabel: "Use Passcode",
          });

          if (result.success) {
            setIsUnlocked(true);
          } else {
            // Stay on splash/lock screen if failed
            setIsUnlocked(false);
          }
        } else {
          setIsUnlocked(true);
        }
      } else {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.log("Biometric error:", error);
      setIsUnlocked(true); // Fallback to let user in if something goes wrong
    } finally {
      setCheckingBiometric(false);
    }
  }

  if (!hydrated || isFirstLaunch === null || checkingBiometric) {
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
          
          {checkingBiometric && token && !isUnlocked ? (
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity 
                onPress={handleBiometricAuth}
                style={{ 
                  backgroundColor: colors.surface, 
                  paddingHorizontal: 20, 
                  paddingVertical: 12, 
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              >
                <Ionicons 
                  name={biometricType === "Face ID" ? "scan" : "finger-print"} 
                  size={20} 
                  color={colors.primary} 
                  style={{ marginRight: 8 }}
                />
                <Typography variant="body1" weight="bold">Tap to Unlock</Typography>
              </TouchableOpacity>
            </View>
          ) : (
            <ActivityIndicator size="small" color={colors.primary} />
          )}
        </LinearGradient>
      </View>
    );
  }

  if (isFirstLaunch) return <Redirect href="/onboarding" />;
  if (token) {
    if (isUnlocked) return <Redirect href="/(tabs)" />;
    // We stay here if locked (though the UI above handles it)
    return null; 
  }
  return <Redirect href="/(auth)/login" />;
}

