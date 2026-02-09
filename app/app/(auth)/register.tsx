import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<"form" | "otp">("form");
  const [otp, setOtp] = useState("");

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Name, email and password required");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      // Register (creates user, but NO token yet)
      await apiPost<{ user: any }>("/auth/register", { 
        name: name.trim(), 
        email: email.trim(), 
        phone: phone.trim() || undefined, 
        password 
      }, { skipAuth: true });
      
      // We don't get a token here anymore. Verification is required.
      // Send OTP explicitly (or backend could do it, but keeping frontend flow for now)
      await apiPost<{ success: boolean; message: string; code?: string }>("/otp/send", { identifier: email.trim(), type: "email" });
      setStep("otp");
      
      Alert.alert("Verify Email", `We sent a code to ${email}`);
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Please try again");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (otp.length !== 6) {
      Alert.alert("Error", "Enter valid 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      // call verify-email to get the token
      const res = await apiPost<{ user: any; token: string }>("/auth/verify-email", { 
        email: email.trim(), 
        otp 
      }, { skipAuth: true });

      if (res.token && res.user) {
        await setAuth(res.token, res.user);
        router.replace("/(tabs)");
      }
    } catch (e) {
      Alert.alert("Verification failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
            <View style={{ marginBottom: 32, alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4 }}>Verify Email</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Enter the code sent to {email}</Text>
            </View>

            <View style={{ 
              backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 4, flexDirection: 'row', alignItems: 'center', marginBottom: 32 
            }}>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16, textAlign: 'center', letterSpacing: 8 }}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={{
                height: 56, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 32,
                backgroundColor: loading ? colors.surfaceActive : colors.primary,
              }}
              onPress={handleVerify}
              disabled={loading}
            >
              <Text style={{ color: '#ffffff', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {loading ? "Verifying..." : "Verify"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
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
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -0.5 }}>Create Account</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Start splitting expenses easily</Text>
          </View>

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
                <Ionicons name="person-outline" size={18} color={colors.textTertiary} />
              </View>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                placeholder="Full Name"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
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
                <Ionicons name="phone-portrait-outline" size={18} color={colors.textTertiary} />
              </View>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                placeholder="Phone Number (Optional)"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
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
                placeholder="Password (6+ chars)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

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
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={{ 
              color: '#ffffff', 
              fontWeight: 'bold', 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1.5 
            }}>
              {loading ? "Creating..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 32 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
