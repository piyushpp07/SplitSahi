import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

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
      Alert.alert("Success", "Password request successfully!", [
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
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
             <TouchableOpacity 
                onPress={() => step === "email" ? router.back() : setStep("email")}
                style={{ position: 'absolute', left: 0, top: 0, padding: 8 }}
             >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
             </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -0.5 }}>
              {step === "email" ? "Forgot Password" : "Reset Password"}
            </Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>
              {step === "email" ? "Enter your email to receive OTP" : "Enter OTP and new password"}
            </Text>
          </View>

          {step === "email" ? (
            <View style={{ gap: 16, marginBottom: 32 }}>
               <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 20, 
                borderWidth: 1, 
                borderColor: colors.border, 
                padding: 4, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}>
                <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  <Ionicons name="mail-outline" size={18} color={colors.textTertiary} />
                </View>
                <TextInput
                  style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                  placeholder="Email Address"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>
          ) : (
            <View style={{ gap: 16, marginBottom: 32 }}>
              {/* Email (Readonly) */}
              <View style={{ padding: 12, alignItems: 'center', marginBottom: 8 }}>
                 <Text style={{ color: colors.textSecondary }}>Checking: {email}</Text>
              </View>
              
              <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 20, 
                borderWidth: 1, 
                borderColor: colors.border, 
                padding: 4, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}>
                <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  <Ionicons name="keypad-outline" size={18} color={colors.textTertiary} />
                </View>
                <TextInput
                  style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                  placeholder="6-Digit OTP"
                  placeholderTextColor={colors.textMuted}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
              </View>

               <View style={{ 
                backgroundColor: colors.surface, 
                borderRadius: 20, 
                borderWidth: 1, 
                borderColor: colors.border, 
                padding: 4, 
                flexDirection: 'row', 
                alignItems: 'center' 
              }}>
                <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                  <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
                </View>
                <TextInput
                  style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                  placeholder="New Password (6+ chars)"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>
            </View>
          )}

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
            onPress={step === "email" ? handleSendOTP : handleResetPassword}
            disabled={loading}
          >
            <Text style={{ 
              color: '#ffffff', 
              fontWeight: 'bold', 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1.5 
            }}>
              {loading ? "Processing..." : (step === "email" ? "Send OTP" : "Reset Password")}
            </Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
