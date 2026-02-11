import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost, apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import EmojiPicker from "@/components/EmojiPicker";

export default function RegisterScreen() {
  const { colors, isDark } = useTheme();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  async function handleCheckUsername(val: string) {
    if (val.length < 3) {
      setIsUsernameValid(null);
      return;
    }
    setUsernameLoading(true);
    try {
      const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
      const res = await apiGet<{ available: boolean }>(`/auth/check-username?username=${sanitized}`, { skipAuth: true });
      setIsUsernameValid(res.available);
    } catch (e) {
      setIsUsernameValid(false);
    } finally {
      setUsernameLoading(false);
    }
  }

  async function handleRegister() {
    if (!name.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    
    // Simple validations
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
    }
    if (isUsernameValid === false) {
      Alert.alert("Error", "Username is taken, please choose another");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<{ user: any; token?: string; needsVerification: boolean }>("/auth/register", {
        email: email.trim(),
        password: password,
        name: name.trim(),
        username: username.trim(),
        emoji,
      }, { skipAuth: true });

      if (res.token && res.user && !res.needsVerification) {
        // Log in immediately if no verification is needed
        await setAuth(res.token, res.user);
        router.replace("/(tabs)");
        return;
      }

      if (res.needsVerification) {
        router.push({
          pathname: "/(auth)/otp-verification",
          params: { email: email.trim() }
        });
      }
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Registration failed");
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
          <Animated.View 
            entering={FadeInUp.delay(200).duration(800)}
            style={{ marginBottom: 32, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -1 }}>Create Account</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Join SplitItUp today</Text>
          </Animated.View>

          <Animated.View 
            entering={FadeInDown.delay(400).duration(800)}
            style={{ gap: 16, marginBottom: 32 }}
          >
            {/* Profile Emoji Selection */}
            <View style={{ alignItems: 'center', marginBottom: 8 }}>
              <TouchableOpacity
                onPress={() => setShowEmojiPicker(true)}
                style={{
                  height: 80,
                  width: 80,
                  borderRadius: 40,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: colors.primary,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 10,
                  elevation: 2,
                }}
              >
                <Text style={{ fontSize: 40 }}>{emoji}</Text>
                <View style={{ 
                  position: 'absolute', 
                  bottom: -4, 
                  right: -4, 
                  backgroundColor: colors.primary, 
                  borderRadius: 12, 
                  padding: 4 
                }}>
                  <Ionicons name="camera" size={12} color="#fff" />
                </View>
              </TouchableOpacity>
              <Text style={{ color: colors.textSecondary, fontSize: 10, marginTop: 8, fontWeight: 'bold', textTransform: 'uppercase' }}>Pick your avatar</Text>
            </View>

            {/* Name */}
            <Input
              icon="person-outline"
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
            />

            {/* Username */}
            <Input
              icon="at-outline"
              placeholder="Unique Username"
              value={username}
              onChangeText={(val) => {
                const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
                setUsername(sanitized);
                handleCheckUsername(sanitized);
              }}
              autoCapitalize="none"
              error={isUsernameValid === false}
              rightElement={
                usernameLoading ? (
                   <Text style={{ fontSize: 10, color: colors.textMuted }}>checking...</Text>
                ) : isUsernameValid !== null && username.length >= 3 ? (
                   <Ionicons 
                     name={isUsernameValid ? "checkmark-circle" : "close-circle"} 
                     size={20} 
                     color={isUsernameValid ? colors.success : colors.error} 
                   />
                ) : undefined
              }
            />
            
            {/* Email Address */}
            <Input
              icon="mail-outline"
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Password */}
            <Input
              icon="lock-closed-outline"
              placeholder="Password (6+ characters)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(600).duration(800)}>
            <Button
              title={loading ? "Creating Account..." : "Register"}
              onPress={handleRegister}
              loading={loading}
              style={{ marginBottom: 32 }}
            />
          </Animated.View>

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
      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={(selected) => setEmoji(selected)}
        onClose={() => setShowEmojiPicker(false)}
      />
    </SafeAreaView>
  );
}
