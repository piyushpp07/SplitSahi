import { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
export default function OTPVerificationScreen() {
  const { colors } = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const setAuth = useAuthStore((s) => s.setAuth);
  
  const inputs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  async function handleVerify() {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Error", "Please enter valid 6-digit OTP");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<{ user?: any; token?: string; needsRegistration?: boolean }>("/auth/verify-otp", {
        identifier: email,
        otp: code,
        type: "email"
      }, { skipAuth: true });

      if (res.token && res.user) {
        await setAuth(res.token, res.user);
        router.replace("/(tabs)");
      } else {
        Alert.alert("Error", "Verification failed. User not found.");
      }
    } catch (e: any) {
      Alert.alert("Verification failed", e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (timer > 0) return;
    
    try {
      await apiPost("/auth/send-otp", {
        identifier: email,
        type: "email"
      }, { skipAuth: true });
      setTimer(30);
      Alert.alert("Success", "OTP resent successfully");
    } catch (e) {
      Alert.alert("Error", "Failed to resend OTP");
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={{ padding: 24, flex: 1, justifyContent: 'center' }}>
          <Animated.View entering={FadeInUp.delay(200).duration(800)} style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{ 
              height: 80, width: 80, borderRadius: 40, 
              backgroundColor: colors.surface, 
              alignItems: 'center', justifyContent: 'center', 
              marginBottom: 24, borderWidth: 1, borderColor: colors.border
            }}>
              <Ionicons name="shield-checkmark" size={40} color={colors.primary} />
            </View>
            <Typography variant="h2" align="center" style={{ marginBottom: 8 }}>Verify Identity</Typography>
            <Typography variant="body1" color="muted" align="center">
              We've sent a 6-digit code to{"\n"}
              <Typography weight="bold">{email}</Typography>
            </Typography>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(800)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
            {otp.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(inst) => { inputs.current[idx] = inst; }}
                style={{
                  width: 45,
                  height: 60,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: digit ? colors.primary : colors.border,
                  textAlign: 'center',
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: colors.text,
                }}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleChange(text, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
              />
            ))}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <Button
              title={loading ? "Verifying..." : "Verify & Proceed"}
              onPress={handleVerify}
              loading={loading}
              style={{ marginBottom: 24 }}
            />

            <TouchableOpacity 
              onPress={handleResend}
              disabled={timer > 0}
              style={{ alignItems: 'center' }}
            >
              <Typography 
                color={timer > 0 ? "muted" : "primary"} 
                weight="bold"
              >
                {timer > 0 ? `Resend code in ${timer}s` : "Resend Code"}
              </Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
