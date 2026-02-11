import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    const fullPhone = `${countryCode}${phone.trim()}`;
    if (!phone.trim() || phone.trim().length < 10) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/auth/send-otp", { 
        identifier: fullPhone, 
        type: "phone" 
      }, { skipAuth: true });
      
      router.push({
        pathname: "/(auth)/otp-verification",
        params: { phone: fullPhone }
      });
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send OTP. Please check if your number is registered.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View 
            entering={FadeInUp.delay(200).duration(800)}
            style={{ marginBottom: 32, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -1 }}>Get Started</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Login or Sign up with your phone</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(800)}
            style={{ gap: 16, marginBottom: 32 }}
          >
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: colors.border, 
              padding: 4, 
              flexDirection: 'row', 
              alignItems: 'center' 
            }}>
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 12,
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  marginRight: 8
                }}
                onPress={() => {
                  // Simple switcher for demo, could be a real picker
                  setCountryCode(countryCode === "+91" ? "+1" : "+91");
                }}
              >
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{countryCode}</Text>
                <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                placeholder="Mobile Number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <TouchableOpacity
              style={{
                height: 56,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 32,
                backgroundColor: loading ? colors.surfaceActive : colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
              onPress={handleSendOTP}
              disabled={loading}
            >
              <Text style={{ 
                color: '#ffffff', 
                fontWeight: 'bold', 
                fontSize: 12, 
                textTransform: 'uppercase', 
                letterSpacing: 1.5 
              }}>
                {loading ? "Sending..." : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 32 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>New user? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
