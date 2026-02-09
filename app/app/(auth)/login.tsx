import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Email and password required");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ user: { id: string; email: string; name: string; phone?: string; upiId?: string; avatarUrl?: string }; token: string }>(
        "/auth/login",
        { email: email.trim(), password },
        { skipAuth: true }
      );
      await setAuth(res.token, { ...res.user });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Login failed", e instanceof Error ? e.message : "Please try again");
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
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -0.5 }}>Welcome Back</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Log in to your account</Text>
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
                <Ionicons name="lock-closed-outline" size={18} color={colors.textTertiary} />
              </View>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                placeholder="Password"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
               <Link href="/(auth)/forgot-password" asChild>
                  <TouchableOpacity>
                     <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '600' }}>Forgot Password?</Text>
                  </TouchableOpacity>
               </Link>
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
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={{ 
              color: '#ffffff', 
              fontWeight: 'bold', 
              fontSize: 12, 
              textTransform: 'uppercase', 
              letterSpacing: 1.5 
            }}>
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>

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
