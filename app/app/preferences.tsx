import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { useTheme } from "@/contexts/ThemeContext";

const BIOMETRIC_KEY = "splitsahise_biometric_enabled";
const NOTIFICATIONS_KEY = "splitsahise_notifications_enabled";

export default function PreferencesScreen() {
  const { themeMode, setThemeMode, colors, isDark } = useTheme();
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
    await SecureStore.setItemAsync(NOTIFICATIONS_KEY, value.toString());
    setNotificationsEnabled(value);
    if (value) {
      Alert.alert("Notifications On", "You'll get alerts for new expenses and payments");
    }
  }

  async function togglePush(value: boolean) {
    if (value) {
      Alert.alert("Development Build Required", "Push notifications are not supported in Expo Go. Please create a development build to test this feature.");
      setPushEnabled(false);
    } else {
        setPushEnabled(false);
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
              style={styles.row}
              onPress={() => {
                Alert.alert("Not Supported", "Push notifications are not supported in Expo Go.");
              }}
            >
              <View style={[styles.rowIconContainer, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                <Ionicons name="paper-plane-outline" size={18} color={colors.info} />
              </View>
              <View style={styles.rowContent}>
                <Text style={[styles.rowTitle, { color: colors.info }]}>Test Push Notification</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.rowIconContainer}>
                <Ionicons name="notifications" size={18} color={colors.accent} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>In-App Alerts</Text>
                <Text style={styles.rowSubtitle}>Show alerts for expenses & payments</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: colors.textMuted, true: colors.primary }}
                thumbColor={"#ffffff"}
              />
            </View>

            <View style={[styles.row, styles.lastRow]}>
              <View style={styles.rowIconContainer}>
                <Ionicons name="mail" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Email Summary</Text>
                <Text style={styles.rowSubtitle}>Weekly activity recap</Text>
              </View>
              <View style={{ backgroundColor: colors.surfaceActive, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold' }}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.card}>
            <View style={styles.themeContainer}>
              <Text style={styles.rowTitle}>Theme</Text>
              
              <View style={styles.themeOptions}>
                {/* System */}
                <TouchableOpacity 
                  onPress={() => setThemeMode("system")}
                  style={[
                    styles.themeOption,
                    { 
                      borderColor: themeMode === "system" ? colors.primary : colors.border,
                      backgroundColor: themeMode === "system" ? (isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff') : colors.surface
                    }
                  ]}
                >
                  <Ionicons 
                    name="phone-portrait-outline" 
                    size={24} 
                    color={themeMode === "system" ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[
                    styles.themeText,
                    { color: themeMode === "system" ? colors.primary : colors.textSecondary }
                  ]}>
                    System
                  </Text>
                </TouchableOpacity>

                {/* Light */}
                <TouchableOpacity 
                  onPress={() => setThemeMode("light")}
                  style={[
                    styles.themeOption,
                    { 
                      borderColor: themeMode === "light" ? colors.primary : colors.border,
                      backgroundColor: themeMode === "light" ? (isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff') : colors.surface
                    }
                  ]}
                >
                  <Ionicons 
                    name="sunny-outline" 
                    size={24} 
                    color={themeMode === "light" ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[
                    styles.themeText,
                    { color: themeMode === "light" ? colors.primary : colors.textSecondary }
                  ]}>
                    Light
                  </Text>
                </TouchableOpacity>

                {/* Dark */}
                <TouchableOpacity 
                  onPress={() => setThemeMode("dark")}
                  style={[
                    styles.themeOption,
                    { 
                      borderColor: themeMode === "dark" ? colors.primary : colors.border,
                      backgroundColor: themeMode === "dark" ? (isDark ? 'rgba(56, 189, 248, 0.1)' : '#f0f9ff') : colors.surface
                    }
                  ]}
                >
                  <Ionicons 
                    name="moon-outline" 
                    size={24} 
                    color={themeMode === "dark" ? colors.primary : colors.textMuted} 
                  />
                  <Text style={[
                    styles.themeText,
                    { color: themeMode === "dark" ? colors.primary : colors.textSecondary }
                  ]}>
                    Dark
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={[styles.row, styles.lastRow, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={styles.rowIconContainer}>
                <Ionicons name="language" size={18} color={colors.textSecondary} />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowTitle}>Language</Text>
                <Text style={styles.rowSubtitle}>English</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
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
