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
  const searchParams = useLocalSearchParams<{ phone?: string; verified?: string }>();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  
  const initialPhone = searchParams.phone || "";
  const initialCode = initialPhone.startsWith("+") ? initialPhone.slice(0, 3) : "+91";
  const initialNumber = initialPhone.startsWith("+") ? initialPhone.slice(3) : initialPhone;

  const [phone, setPhone] = useState(initialNumber);
  const [countryCode, setCountryCode] = useState(initialCode);
  const [username, setUsername] = useState("");
  const [emoji, setEmoji] = useState("👤");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [isUsernameValid, setIsUsernameValid] = useState<boolean | null>(null);
  
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);

  const isAutoVerified = searchParams.verified === "true";

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
    const fullPhone = isAutoVerified ? phone : `${countryCode}${phone.trim()}`;
    if (!phone.trim() || !name.trim() || !username.trim() || !email.trim()) {
      Alert.alert("Error", "All fields are required including Email");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }
    if (isUsernameValid === false) {
      Alert.alert("Error", "Please choose a different username");
      return;
    }

    setLoading(true);
    try {
      const res = await apiPost<{ user: any; token?: string; needsVerification: boolean }>("/auth/register", {
        email: email.trim() || undefined,
        name: name.trim(),
        phone: fullPhone,
        username: username.trim(),
        emoji,
        skipOTP: isAutoVerified
      }, { skipAuth: true });

      if (res.token && res.user && !res.needsVerification) {
        // Log in immediately if no verification is needed (either auto-verified or not requiring OTP)
        await setAuth(res.token, res.user);
        router.replace("/(tabs)");
        return;
      }

      if (res.needsVerification) {
        router.push({
          pathname: "/(auth)/otp-verification",
          params: email.trim() ? { email: email.trim() } : { phone: fullPhone }
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
            <Text style={{ fontSize: 32, fontWeight: 'bold', color: colors.text, marginBottom: 4, letterSpacing: -1 }}>Get Started</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 2, fontSize: 10 }}>Experience the new SplitItUp</Text>
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
                  setUsername(val.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                  handleCheckUsername(val);
                }}
                autoCapitalize="none"
              />
              {usernameLoading ? (
                <View style={{ marginRight: 12 }}>
                   <Text style={{ fontSize: 10, color: colors.textMuted }}>checking...</Text>
                </View>
              ) : isUsernameValid !== null && username.length >= 3 && (
                <View style={{ marginRight: 12 }}>
                   <Ionicons 
                     name={isUsernameValid ? "checkmark-circle" : "close-circle"} 
                     size={20} 
                     color={isUsernameValid ? colors.success : colors.error} 
                   />
                </View>
              )}
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
                <Ionicons name="mail-outline" size={18} color={colors.primary} />
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

            {/* Phone Number - Primary */}
            <View style={{ 
              backgroundColor: colors.surface, 
              borderRadius: 20, 
              borderWidth: 1, 
              borderColor: colors.border, 
              padding: 4, 
              flexDirection: 'row', 
              alignItems: 'center',
              opacity: isAutoVerified ? 0.7 : 1
            }}>
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingHorizontal: 12,
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  marginRight: 8
                }}
                onPress={() => {
                  setCountryCode(countryCode === "+91" ? "+1" : "+91");
                }}
                disabled={isAutoVerified}
              >
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{countryCode}</Text>
                {!isAutoVerified && <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
              <TextInput
                style={{ flex: 1, padding: 12, color: isAutoVerified ? colors.textSecondary : colors.text, fontSize: 16 }}
                placeholder="Phone Number"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!isAutoVerified}
              />
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
                {loading ? "Sending OTP..." : "Continue"}
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
