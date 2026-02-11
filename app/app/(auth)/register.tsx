import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Link, router, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { apiPost, apiGet } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
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

            {/* Username */}
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: isUsernameValid === false ? colors.error : colors.border, 
              padding: 4, 
              flexDirection: 'row', 
              alignItems: 'center' 
            }}>
              <View style={{ height: 40, width: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}>
                <Ionicons name="at-outline" size={18} color={isUsernameValid === false ? colors.error : colors.primary} />
              </View>
              <TextInput
                style={{ flex: 1, padding: 12, color: colors.text, fontSize: 16 }}
                placeholder="Unique Username"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={(val) => {
                  const sanitized = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
                  setUsername(sanitized);
                  handleCheckUsername(sanitized);
                }}
                autoCapitalize="none"
              />
              {usernameLoading ? (
                <View style={{ marginRight: 12 }}>
                   <Text style={{ fontSize: 10, color: colors.textMuted }}>checking...</Text>
                </View>
              ) : isUsernameValid !== null && username.length >= 3 ? (
                <View style={{ marginRight: 12 }}>
                   <Ionicons 
                     name={isUsernameValid ? "checkmark-circle" : "close-circle"} 
                     size={20} 
                     color={isUsernameValid ? colors.success : colors.error} 
                   />
                </View>
              ) : null}
            </View>
            
            {/* Email Address */}
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
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Password */}
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
                placeholder="Password (6+ characters)"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
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
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={{ 
                color: '#ffffff', 
                fontWeight: 'bold', 
                fontSize: 12, 
                textTransform: 'uppercase', 
                letterSpacing: 1 
              }}>
                {loading ? "Creating Account..." : "Register"}
              </Text>
            </TouchableOpacity>
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
