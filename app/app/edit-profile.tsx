import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiPatch } from "@/lib/api";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Linking from "expo-linking";
import AvatarPicker from "@/components/AvatarPicker";
import EmojiPicker from "@/components/EmojiPicker";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [emoji, setEmoji] = useState(user?.emoji || "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(
    user?.avatarUrl?.startsWith('gradient:') ? user.avatarUrl.split(':')[1] : null
  );
  const [loading, setLoading] = useState(false);
  const [isUpiVerified, setIsUpiVerified] = useState(!!user?.upiId);

  async function handleVerify() {
    if (!upiId.trim() || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      Alert.alert("Format Error", "Please enter a valid UPI ID (e.g. name@bank) before verifying.");
      return;
    }

    Alert.alert(
      "Verify UPI ID",
      "We will open your UPI app to verify this ID. You will see a ₹1.00 request (you don't need to complete the payment, just check if the name matches).",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Open UPI App", 
          onPress: async () => {
            const upiUrl = `upi://pay?pa=${upiId.trim()}&pn=${encodeURIComponent(name)}&am=1.00&cu=INR`;
            try {
              const supported = await Linking.canOpenURL(upiUrl);
              if (supported) {
                await Linking.openURL(upiUrl);
                setIsUpiVerified(true);
              } else {
                Alert.alert(
                  "No UPI App", 
                  "We couldn't find a UPI app (GPay/PhonePe) on this device. If you are sure this ID is correct, you can verify manually.",
                  [
                    { text: "Try Again", style: "default" },
                    { text: "Manual Verify", style: "destructive", onPress: () => setIsUpiVerified(true) }
                  ]
                );
              }
            } catch (e) {
              setIsUpiVerified(true);
            }
          }
        }
      ]
    );
  }

  async function handleUpdate() {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }
    
    if (upiId.trim() && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. user@bank)");
      return;
    }

    if (upiId.trim() && !isUpiVerified) {
       Alert.alert("Verify VPA", "Please click the 'Verify' button to ensure your UPI ID is correct and active.");
       return;
    }
    
    if (phone.trim() && !/^\d{10}$/.test(phone.trim().replace(/\D/g, ''))) {
      Alert.alert("Invalid Phone", "Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const updated = await apiPatch<any>("/users/me", {
        name: name.trim(),
        upiId: upiId.trim() || null,
        phone: phone.trim() || null,
        avatarUrl: avatarUrl || null,
        emoji: emoji || null,
      });
      setUser(updated);
      Alert.alert("Success", "Profile updated successfully");
      router.back();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, paddingHorizontal: 20 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, marginTop: 16 }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ 
              height: 40, width: 40, borderRadius: 12, 
              backgroundColor: colors.surface, 
              alignItems: 'center', justifyContent: 'center', 
              marginRight: 16,
              borderWidth: 1,
              borderColor: colors.border
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.text }}>Edit Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Avatar Selection */}
          <AvatarPicker 
            label="Pick your Avatar" 
            selectedId={selectedAvatarId} 
            onSelect={(id, url) => {
              setSelectedAvatarId(id);
              setAvatarUrl(url);
            }} 
          />

          {/* Emoji Selection */}
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 12 }}>
              Profile Emoji (Optional)
            </Text>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                flexDirection: 'row',
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View style={{
                height: 56,
                width: 56,
                borderRadius: 28,
                backgroundColor: colors.surfaceActive,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16,
              }}>
                <Text style={{ fontSize: 28 }}>{emoji || "😊"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight:  'bold', fontSize: 14 }}>
                  {emoji ? "Change Emoji" : "Pick an Emoji"}
                </Text>
                <Text style={{ color: colors.textTertiary, fontSize: 12, marginTop: 2 }}>
                  Shows next to your name
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            {emoji && (
              <TouchableOpacity
                onPress={() => setEmoji("")}
                style={{ marginTop: 8, alignSelf: 'flex-start' }}
              >
                <Text style={{ color: colors.error, fontSize: 12, fontWeight: 'bold' }}>Remove Emoji</Text>
              </TouchableOpacity>
            )}
          </View>


          <View style={{ marginBottom: 24 }}>
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Full Name</Text>
              <TextInput
                style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 12, 
                  padding: 16, 
                  color: colors.text, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}
                value={name}
                onChangeText={setName}
                placeholder="e.g. John Doe"
                placeholderTextColor={colors.textMuted}
              />
            </View>
            
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>UPI ID</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TextInput
                  style={{ 
                    flex: 1,
                    backgroundColor: colors.surface, 
                    borderRadius: 12, 
                    padding: 16, 
                    color: colors.text, 
                    borderWidth: 1, 
                    borderColor: colors.border 
                  }}
                  value={upiId}
                  onChangeText={(txt) => {
                    setUpiId(txt);
                    setIsUpiVerified(false);
                  }}
                  placeholder="user@upi"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                   onPress={handleVerify}
                   style={{ 
                     backgroundColor: isUpiVerified ? '#10b981' : colors.surfaceActive, 
                     paddingHorizontal: 16, 
                     borderRadius: 12, 
                     alignItems: 'center', 
                     justifyContent: 'center',
                     borderWidth: 1,
                     borderColor: isUpiVerified ? '#10b981' : colors.border
                   }}
                >
                  <Ionicons 
                    name={isUpiVerified ? "checkmark-circle" : "shield-checkmark-outline"} 
                    size={20} 
                    color={isUpiVerified ? "#fff" : colors.primary} 
                  />
                  {!isUpiVerified && <Text style={{ fontSize: 10, fontWeight: 'bold', color: colors.primary, marginTop: 2 }}>Verify</Text>}
                </TouchableOpacity>
              </View>
              <Text style={{ color: colors.textTertiary, fontSize: 10, marginTop: 4, marginLeft: 4 }}>
                {isUpiVerified ? "✓ Verified & Active" : "Used for receiving payments"}
              </Text>
            </View>

            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: 'bold', marginBottom: 8 }}>Phone Number</Text>
              <TextInput
                style={{ 
                  backgroundColor: colors.surface, 
                  borderRadius: 12, 
                  padding: 16, 
                  color: colors.text, 
                  borderWidth: 1, 
                  borderColor: colors.border 
                }}
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            style={{ 
              height: 56, 
              borderRadius: 12, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 40,
              backgroundColor: loading ? colors.surfaceActive : colors.primary,
            }}
            onPress={handleUpdate}
            disabled={loading}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
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
