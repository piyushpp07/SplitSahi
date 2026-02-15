import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as Notifications from "expo-notifications";
import { useTheme, ThemeMode } from "@/contexts/ThemeContext";

const BIOMETRIC_KEY = "splitsahise_biometric_enabled";
const NOTIFICATIONS_KEY = "splitsahise_notifications_enabled";
const SAVED_IDENTIFIER_KEY = "splitsahise_user_identifier";

import { useAuthStore } from "@/store/authStore";
import { apiPatch } from "@/lib/api";
import CurrencySelector from "@/components/CurrencySelector";

export default function PreferencesScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const userCurrency = user?.currency || "INR";

  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>("Biometric");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBiometricSupport();
    loadPreferences();
  }, []);

  async function changeCurrency(currency: string) {
    try {
      if (!user) return;
      // Optimistic update
      const updatedUser = { ...user, currency };
      await setUser(updatedUser);
      
      await apiPatch("/users/me", { currency });
      Alert.alert("Currency Updated", `Your primary currency is now ${currency}`);
    } catch (e) {
      Alert.alert("Error", "Failed to update currency");
      // Revert if needed, but for now simple alert
    }
  }

  async function checkBiometricSupport() {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);

    if (compatible) {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType("Face ID");
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType("Fingerprint");
      }
    }
  }

  async function loadPreferences() {
    try {
      const biometric = await SecureStore.getItemAsync(BIOMETRIC_KEY);
      const notifications = await SecureStore.getItemAsync(NOTIFICATIONS_KEY);
      
      setBiometricEnabled(biometric === "true");
      setNotificationsEnabled(notifications !== "false");
    } catch (e) {
      console.log("Error loading preferences:", e);
    } finally {
      setLoading(false);
    }
  }

  async function toggleBiometric(value: boolean) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify to enable biometric login",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });

      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, "true");
        // Save contemporary identifier
        if (user?.email) {
          await SecureStore.setItemAsync(SAVED_IDENTIFIER_KEY, user.email);
        } else if (user?.username) {
          await SecureStore.setItemAsync(SAVED_IDENTIFIER_KEY, user.username);
        }
        setBiometricEnabled(true);
        Alert.alert("Done!", `${biometricType} is now enabled for login`);
      } else {
        Alert.alert("Failed", "Authentication failed");
      }
    } else {
      await SecureStore.setItemAsync(BIOMETRIC_KEY, "false");
      setBiometricEnabled(false);
    }
  }

  async function toggleNotifications(value: boolean) {
    if (value) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Confirm settings change",
      });
      if (!result.success) return;
    }
    await SecureStore.setItemAsync(NOTIFICATIONS_KEY, value.toString());
    setNotificationsEnabled(value);
  }

  async function togglePush(value: boolean) {
    if (value) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission Required', 'Enable notifications in settings to use push features');
        setPushEnabled(false);
        return;
      }
      setPushEnabled(true);
    } else {
      setPushEnabled(false);
    }
  }

  async function testNotification() {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "SahiSplit Test! 💸",
          body: "This is a test notification to verify your settings.",
          data: { screen: 'preferences' },
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (e) {
      Alert.alert("Error", "Could not trigger notification");
    }
  }

  async function testBiometric() {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Test your biometric",
      fallbackLabel: "Use Passcode",
    });

    if (result.success) {
      Alert.alert("Works! ✅", "Biometric authentication is working correctly");
    } else {
      Alert.alert("Failed", result.error || "Authentication failed");
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 16,
    },
    backBtn: {
      height: 40,
      width: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: 'bold',
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    rowIconContainer: {
      height: 36,
      width: 36,
      borderRadius: 10,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    rowContent: {
      flex: 1,
    },
    rowTitle: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 14,
    },
    rowSubtitle: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 2,
    },
    themeContainer: {
      padding: 16,
    },
    themeOptions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 12,
    },
    themeOption: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeText: {
      marginTop: 8,
      fontWeight: 'bold',
      fontSize: 12,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          
          <View style={styles.card}>
            {/* Biometric Toggle */}
            <View style={styles.row}>
              <View style={styles.rowIconContainer}>
                <Ionicons 
                  name={biometricType === "Face ID" ? "scan" : "finger-print"} 
                  size={18} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>{biometricType} Login</Text>
                <Text style={styles.rowSubtitle}>
                  {biometricAvailable ? "Use biometric to open app" : "Not available on this device"}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                disabled={!biometricAvailable}
                trackColor={{ false: colors.textMuted, true: colors.primary }}
                thumbColor={isDark ? "#fff" : "#fff"}
              />
            </View>

            {/* Change Password */}
            <TouchableOpacity 
              style={styles.row}
              onPress={() => router.push("/change-password")}
            >
              <View style={styles.rowIconContainer}>
                <Ionicons name="key-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Change Password</Text>
                <Text style={styles.rowSubtitle}>Update your account security</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </TouchableOpacity>

            {/* Test Biometric */}
            {biometricAvailable && (
              <TouchableOpacity 
                style={[styles.row, styles.lastRow]}
                onPress={testBiometric}
              >
                <View style={styles.rowIconContainer}>
                  <Ionicons name="shield-checkmark" size={18} color={colors.success} />
                </View>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>Test Biometric</Text>
                  <Text style={styles.rowSubtitle}>Make sure it's working</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.rowIconContainer, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed' }]}>
                <Ionicons name="notifications-outline" size={18} color={colors.warning} />
              </View>
              <View style={styles.rowContent}>
                 <Text style={styles.rowTitle}>Push Notifications</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={togglePush}
                trackColor={{ false: colors.textMuted, true: colors.primary }}
                thumbColor={"#ffffff"}
              />
            </View>
            
            <TouchableOpacity 
              style={[styles.row, styles.lastRow]}
              onPress={testNotification}
            >
              <View style={[styles.rowIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.info} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.info }]}>Test Notification</Text>
                <Text style={styles.rowSubtitle}>Check if alerts are working</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Financial Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial</Text>
          <View style={styles.card}>
            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowIconContainer}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Currency</Text>
                <Text style={styles.rowSubtitle}>Primary display currency</Text>
              </View>
              <CurrencySelector 
                selectedCurrency={userCurrency}
                onSelect={changeCurrency}
                compact={true}
              />
            </View>
          </View>
        </View>

        {/* Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.card}>
            <View style={styles.themeContainer}>
              <Text style={styles.rowTitle}>Theme</Text>
              <View style={styles.themeOptions}>
                {[
                  { mode: 'system', label: 'System', icon: 'phone-portrait-outline' },
                  { mode: 'light', label: 'Light', icon: 'sunny-outline' },
                  { mode: 'dark', label: 'Dark', icon: 'moon-outline' }
                ].map((item) => {
                  const isActive = themeMode === item.mode;
                  return (
                    <TouchableOpacity 
                      key={item.mode}
                      onPress={() => setThemeMode(item.mode as ThemeMode)}
                      style={[
                        styles.themeOption,
                        { 
                          borderColor: isActive ? colors.primary : colors.border,
                          backgroundColor: isActive 
                            ? (isDark ? 'rgba(129, 140, 248, 0.15)' : '#eff6ff') 
                            : colors.surface
                        }
                      ]}
                    >
                      <Ionicons 
                        name={item.icon as any} 
                        size={22} 
                        color={isActive ? colors.primary : colors.textMuted} 
                      />
                      <Text style={[
                        styles.themeText,
                        { color: isActive ? colors.primary : colors.textSecondary }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Version */}
        <View style={{ alignItems: 'center', marginVertical: 32 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12 }}>SplitItUp v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
