import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
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
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8 items-center">
            <Text className="text-2xl font-bold text-white tracking-tighter mb-1">Welcome Back</Text>
            <Text className="text-slate-500 font-bold uppercase tracking-[2px] text-[10px]">Log in to your account</Text>
          </View>

          <View className="gap-4 mb-8">
            <View className="bg-slate-900 rounded-[20px] border border-slate-800 p-1 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center ml-2">
                <Ionicons name="mail-outline" size={18} color="#64748b" />
              </View>
              <TextInput
                className="flex-1 px-3 py-3 text-white text-base "
                placeholder="Email Address"
                placeholderTextColor="#475569"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View className="bg-slate-900 rounded-[20px] border border-slate-800 p-1 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center ml-2">
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
              </View>
              <TextInput
                className="flex-1 px-3 py-3 text-white text-base "
                placeholder="Password"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className={`h-14 rounded-[20px] items-center justify-center mb-8 shadow-xl ${loading ? 'bg-slate-800' : 'bg-primary'}`}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-[#020617] font-bold text-xs uppercase tracking-widest">
              {loading ? "Logging in..." : "Log In"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">New user? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-[10px] uppercase tracking-widest">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
