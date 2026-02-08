import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Error", "Name, email and password required");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await apiPost<{ user: { id: string; email: string; name: string; phone?: string; upiId?: string; avatarUrl?: string }; token: string }>(
        "/auth/register",
        { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined, password },
        { skipAuth: true }
      );
      await setAuth(res.token, { ...res.user });
      router.replace("/(tabs)");
    } catch (e) {
      Alert.alert("Sign up failed", e instanceof Error ? e.message : "Please try again");
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
            <Text className="text-2xl font-bold text-white tracking-tighter mb-1">Create Account</Text>
            <Text className="text-slate-500 font-bold uppercase tracking-[2px] text-[10px]">Start splitting expenses easily</Text>
          </View>

          <View className="gap-4 mb-8">
            <View className="bg-slate-900 rounded-[20px] border border-slate-800 p-1 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center ml-2">
                <Ionicons name="person-outline" size={18} color="#64748b" />
              </View>
              <TextInput
                className="flex-1 px-3 py-3 text-white text-base "
                placeholder="Full Name"
                placeholderTextColor="#475569"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                <Ionicons name="phone-portrait-outline" size={18} color="#64748b" />
              </View>
              <TextInput
                className="flex-1 px-3 py-3 text-white text-base "
                placeholder="Phone Number (Optional)"
                placeholderTextColor="#475569"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View className="bg-slate-900 rounded-[20px] border border-slate-800 p-1 flex-row items-center">
              <View className="h-10 w-10 items-center justify-center ml-2">
                <Ionicons name="lock-closed-outline" size={18} color="#64748b" />
              </View>
              <TextInput
                className="flex-1 px-3 py-3 text-white text-base "
                placeholder="Password (6+ chars)"
                placeholderTextColor="#475569"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity
            className={`h-14 rounded-[20px] items-center justify-center mb-8 shadow-xl ${loading ? 'bg-slate-800' : 'bg-primary'}`}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text className="text-[#020617] font-bold text-xs uppercase tracking-widest">
              {loading ? "Creating..." : "Sign Up"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center items-center pb-8">
            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-tighter">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-bold text-[10px] uppercase tracking-widest">Log In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
