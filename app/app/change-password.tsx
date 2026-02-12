import { useState } from "react";
import { View, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { apiPost } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

export default function ChangePasswordScreen() {
  const { colors } = useTheme();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleChangePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (oldPassword === newPassword) {
        Alert.alert("Error", "New password cannot be the same as old password");
        return;
    }

    setLoading(true);
    try {
      await apiPost("/users/change-password", { oldPassword, newPassword });
      Alert.alert("Success", "Password updated successfully!", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update password");
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
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: 40, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={{ 
                height: 40, width: 40, borderRadius: 12, 
                backgroundColor: colors.surface, 
                alignItems: 'center', justifyContent: 'center', 
                marginRight: 16, borderWidth: 1, borderColor: colors.border
              }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Typography variant="h2">Change Password</Typography>
          </View>

          <View style={{ gap: 24, marginBottom: 40 }}>
            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Current Password</Typography>
              <Input
                icon="lock-closed-outline"
                placeholder="Enter current password"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>New Password</Typography>
              <Input
                icon="lock-open-outline"
                placeholder="6+ characters"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
            </View>

            <View>
              <Typography variant="label" color="muted" style={{ marginBottom: 8, marginLeft: 4 }}>Confirm New Password</Typography>
              <Input
                icon="shield-checkmark-outline"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>
          </View>

          <Button
            title={loading ? "Updating..." : "Update Password"}
            onPress={handleChangePassword}
            loading={loading}
          />

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
