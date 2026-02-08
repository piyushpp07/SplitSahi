import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, Switch, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import * as Notifications from 'expo-notifications';

const BIOMETRIC_KEY = "splitsahise_biometric_enabled";
const NOTIFICATIONS_KEY = "splitsahise_notifications_enabled";

export default function PreferencesScreen() {
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

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <ScrollView className="flex-1 px-5">
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Settings</Text>
        </View>

        {/* Security Section */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-bold mb-3">Security</Text>
          
          <View className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            {/* Biometric Toggle */}
            <View className="p-4 flex-row items-center border-b border-slate-800">
              <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                <Ionicons 
                  name={biometricType === "Face ID" ? "scan" : "finger-print"} 
                  size={18} 
                  color="#38bdf8" 
                />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">{biometricType} Login</Text>
                <Text className="text-slate-500 text-xs">
                  {biometricAvailable ? "Use biometric to open app" : "Not available on this device"}
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={toggleBiometric}
                disabled={!biometricAvailable}
                trackColor={{ false: "#334155", true: "#0ea5e9" }}
                thumbColor={biometricEnabled ? "#38bdf8" : "#64748b"}
              />
            </View>

            {/* Test Biometric */}
            {biometricAvailable && (
              <TouchableOpacity 
                className="p-4 flex-row items-center"
                onPress={testBiometric}
              >
                <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                  <Ionicons name="shield-checkmark" size={18} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold">Test Biometric</Text>
                  <Text className="text-slate-500 text-xs">Make sure it's working</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Notifications Section */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-bold mb-3">Notifications</Text>
          
          <View className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
              <View className="p-4 flex-row items-center justify-between border-b border-slate-800">
                <View className="flex-row items-center">
                  <View className="h-8 w-8 rounded-lg bg-orange-500/10 items-center justify-center mr-3">
                    <Ionicons name="notifications-outline" size={18} color="#f97316" />
                  </View>
                  <Text className="text-white ">Push Notifications</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={togglePush}
                  trackColor={{ false: "#334155", true: "#38bdf8" }}
                  thumbColor={pushEnabled ? "#ffffff" : "#94a3b8"}
                />
              </View>
              
              <TouchableOpacity 
                className="p-4 flex-row items-center active:bg-slate-800"
                onPress={async () => {
                  const { status } = await Notifications.requestPermissionsAsync();
                  if (status !== 'granted') {
                    Alert.alert('Permission needed', 'Please enable notifications in settings');
                    return;
                  }
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: "Test Notification 🔔",
                      body: "This is a test notification from SplitSahiSe!",
                      data: { test: true },
                    },
                    trigger: null, // immediate
                  });
                }}
              >
                <View className="flex-row items-center flex-1">
                  <View className="h-8 w-8 rounded-lg bg-blue-500/10 items-center justify-center mr-3">
                    <Ionicons name="paper-plane-outline" size={18} color="#3b82f6" />
                  </View>
                  <Text className="text-blue-400 ">Test Push Notification</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#475569" />
              </TouchableOpacity>

            <View className="p-4 flex-row items-center border-b border-slate-800">
              <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                <Ionicons name="notifications" size={18} color="#818cf8" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">In-App Alerts</Text>
                <Text className="text-slate-500 text-xs">Show alerts for expenses & payments</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#334155", true: "#6366f1" }}
                thumbColor={notificationsEnabled ? "#818cf8" : "#64748b"}
              />
            </View>

            <View className="p-4 flex-row items-center">
              <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                <Ionicons name="mail" size={18} color="#475569" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">Email Summary</Text>
                <Text className="text-slate-500 text-xs">Weekly activity recap</Text>
              </View>
              <View className="bg-slate-800 px-2.5 py-1 rounded-lg">
                <Text className="text-slate-500 text-xs ">Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>

        {/* App Section */}
        <View className="mb-6">
          <Text className="text-slate-500 text-xs font-bold mb-3">Appearance</Text>
          
          <View className="bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
            <View className="p-4 flex-row items-center border-b border-slate-800">
              <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                <Ionicons name="moon" size={18} color="#475569" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">Dark Mode</Text>
                <Text className="text-slate-500 text-xs">Always on</Text>
              </View>
              <View className="bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                <Text className="text-emerald-400 text-xs ">Active</Text>
              </View>
            </View>

            <View className="p-4 flex-row items-center">
              <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                <Ionicons name="language" size={18} color="#475569" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold">Language</Text>
                <Text className="text-slate-500 text-xs">English</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#334155" />
            </View>
          </View>
        </View>

        {/* Version */}
        <View className="items-center py-8">
          <Text className="text-slate-700 text-xs">SplitSahiSe v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
