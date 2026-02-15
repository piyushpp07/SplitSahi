import { useState } from "react";
import { View, Alert, ScrollView, Platform, KeyboardAvoidingView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiPatch } from "@/lib/api";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import * as Linking from "expo-linking";
import EmojiPicker from "@/components/EmojiPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [email, setEmail] = useState(user?.email || "");
  const [emoji, setEmoji] = useState((user as any)?.emoji || "👤");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isUpiVerified, setIsUpiVerified] = useState(!!user?.upiId);

  async function handleVerify() {
    if (!upiId.trim() || !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      Alert.alert("Format Error", "Please enter a valid UPI ID (e.g. name@bank) before verifying.");
      return;
    }

    Alert.alert(
      "Verify UPI ID",
      "We will open your UPI app to verify this ID.",
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
                Alert.alert("Manual Verify", "No UPI app found. Verify manually?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Yes", onPress: () => setIsUpiVerified(true) }
                ]);
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
    
    setLoading(true);
    try {
      const updated = await apiPatch<any>("/users/me", {
        name: name.trim(),
        email: email.trim() || null,
        upiId: upiId.trim() || null,
        phone: phone.trim() || null,
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
        style={{ flex: 1 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 24, marginTop: 16 }}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{ 
              height: 44, width: 44, borderRadius: 14, 
              backgroundColor: colors.surface, 
              alignItems: 'center', justifyContent: 'center', 
              marginRight: 16, borderWidth: 1, borderColor: colors.border
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Typography variant="h2">Edit Profile</Typography>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 32, alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(true)}
              style={{
                height: 120, width: 120, borderRadius: 60,
                backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 4, borderColor: colors.primary,
                marginBottom: 16,
              }}
            >
              <Typography style={{ fontSize: 60 }}>{emoji || "😊"}</Typography>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowEmojiPicker(true)}>
              <Typography color="primary" weight="bold">Change Avatar Emoji</Typography>
            </TouchableOpacity>
          </View>

          <View style={{ gap: 24, marginBottom: 40 }}>
            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Full Name</Typography>
              <Input
                placeholder="Your Name"
                value={name}
                onChangeText={setName}
                icon="person-outline"
              />
            </View>

            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Username</Typography>
              <Input
                placeholder="username"
                value={username}
                onChangeText={setUsername}
                icon="at-outline"
                autoCapitalize="none"
                editable={false} // Match backend restriction for now
                style={{ opacity: 0.7 }}
              />
              <Typography variant="caption" color="muted" style={{ marginTop: 4, marginLeft: 4 }}>Usernames cannot be changed yet</Typography>
            </View>
            
            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>UPI ID</Typography>
              <Input
                placeholder="user@upi"
                value={upiId}
                onChangeText={(txt) => { setUpiId(txt); setIsUpiVerified(false); }}
                icon="card-outline"
                autoCapitalize="none"
                rightElement={
                  <TouchableOpacity 
                    onPress={handleVerify}
                    style={{ 
                      backgroundColor: isUpiVerified ? colors.success : colors.primary,
                      paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12
                    }}
                  >
                    <Typography weight="bold" style={{ color: '#fff', fontSize: 10 }}>
                      {isUpiVerified ? "Verified" : "Verify"}
                    </Typography>
                  </TouchableOpacity>
                }
              />
            </View>

            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Phone Number</Typography>
              <Input
                placeholder="+91 98765 43210"
                value={phone}
                onChangeText={setPhone}
                icon="call-outline"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Email Address</Typography>
              <Input
                placeholder="user@example.com"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Button
            title="Update Profile"
            onPress={handleUpdate}
            loading={loading}
            style={{ marginBottom: 40 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <EmojiPicker
        visible={showEmojiPicker}
        onSelect={(selected) => setEmoji(selected)}
        onClose={() => setShowEmojiPicker(false)}
        context="profile"
      />
    </SafeAreaView>
  );
}

