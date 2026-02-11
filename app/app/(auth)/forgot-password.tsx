import { useState } from "react";
import { View, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const [step, setStep] = useState<"email" | "reset">("email");
  const [loading, setLoading] = useState(false);

  async function handleSendOTP() {
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ success: boolean; message: string; code?: string }>("/otp/send", { identifier: email.trim(), type: "email" });
      setStep("reset");
      if (res.code) {
        Alert.alert("Dev Mode", `Your OTP code is: ${res.code}`);
      } else {
        Alert.alert("OTP Sent", `Check ${email} for your verification code`);
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter valid 6-digit OTP");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/auth/reset-password", { email: email.trim(), otp, newPassword });
      Alert.alert("Success", "Password reset successfully!", [
        { text: "Log In", onPress: () => router.replace("/(auth)/login") }
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 40, alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => step === "email" ? router.back() : setStep("email")}
              style={{ position: 'absolute', left: 0, top: 4, padding: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            
            <Typography variant="h2" align="center" style={{ marginBottom: 4 }}>
              {step === "email" ? "Forgot Password" : "Reset Password"}
            </Typography>
            <Typography variant="label" color="muted" align="center">
              {step === "email" ? "Enter your email to receive OTP" : "Enter OTP and new password"}
            </Typography>
          </View>

          {step === "email" ? (
            <View style={{ gap: 16, marginBottom: 32 }}>
              <Input
                icon="mail-outline"
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          ) : (
            <View style={{ gap: 16, marginBottom: 32 }}>
              {/* Email (Readonly) */}
              <View style={{ padding: 12, alignItems: 'center', marginBottom: 8, backgroundColor: colors.surface, borderRadius: 16 }}>
                <Typography color="muted">Checking: <Typography weight="bold" color="text">{email}</Typography></Typography>
              </View>
              
              <Input
                icon="keypad-outline"
                placeholder="6-Digit OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />

              <Input
                icon="lock-closed-outline"
                placeholder="New Password (6+ chars)"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>
          )}

          <Button
            title={loading ? "Processing..." : (step === "email" ? "Send OTP" : "Reset Password")}
            onPress={step === "email" ? handleSendOTP : handleResetPassword}
            loading={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

