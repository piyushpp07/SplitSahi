import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

export default function LoginScreen() {
  const { colors } = useTheme();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleLogin() {
    if (!identifier.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter email/username and password");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<{ user: any; token: string }>("/auth/login", { 
        identifier: identifier.trim(), 
        password: password
      }, { skipAuth: true });
      
      if (res.token && res.user) {
        await setAuth(res.token, res.user);
        router.replace("/(tabs)");
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Login failed. Please check your credentials.");
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
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -1 }}>Welcome Back</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Sign in to continue</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(800)}
            style={{ gap: 16, marginBottom: 32 }}
          >
            {/* Identifier Input */}
            <Input
              icon="person-outline"
              placeholder="Email or Username"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
            />

            {/* Password Input */}
            <Input
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <View style={{ alignItems: 'flex-end' }}>
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity>
                  <Text style={{ color: colors.primary, fontSize: 12, fontWeight: 'bold' }}>Forgot Password?</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <Button
              title={loading ? "Signing In..." : "Sign In"}
              onPress={handleLogin}
              loading={loading}
              style={{ marginBottom: 32 }}
            />
          </Animated.View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingBottom: 32 }}>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>New here? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Create Account</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
