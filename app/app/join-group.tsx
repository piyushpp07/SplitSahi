import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function JoinGroupScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ code?: string }>();
  const [inviteCode, setInviteCode] = useState(params.code || "");
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: async (groupId: string) => {
      return await apiPost<{ message: string; group: any }>("/groups/join", {
        groupId,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      Alert.alert("Success! 🎉", data.message, [
        {
          text: "View Group",
          onPress: () => router.replace(`/group/${data.group.id}`),
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert(
        "Failed to Join",
        error.message || "Invalid invite code. Please try again."
      );
    },
  });

  function handleJoin() {
    const code = inviteCode.trim();
    if (!code) {
      Alert.alert("Required", "Please enter an invite code");
      return;
    }
    joinMutation.mutate(code);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 32,
      marginTop: 8,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.text,
    },
    illustration: {
      alignItems: "center",
      marginBottom: 40,
    },
    illustrationIcon: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.surfaceActive,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    illustrationTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      textAlign: "center",
      marginBottom: 8,
    },
    illustrationText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
      paddingHorizontal: 40,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    textInput: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 18,
      fontWeight: "600",
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      letterSpacing: 2,
      textAlign: "center",
    },
    joinBtn: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      opacity: joinMutation.isPending ? 0.6 : 1,
    },
    joinBtnText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    helpCard: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    }
  });

  return (
    <SafeAreaView
      style={styles.container}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1, padding: 20 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Join Group
          </Text>
        </View>

        {/* Illustration */}
        <View style={styles.illustration}>
          <View style={styles.illustrationIcon}>
            <Ionicons name="people" size={56} color={colors.primary} />
          </View>
          <Text style={styles.illustrationTitle}>
            Enter Invite Code
          </Text>
          <Text style={styles.illustrationText}>
            Ask your friend for the group invite code to join
          </Text>
        </View>

        {/* Input */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles.inputLabel}>
            INVITE CODE
          </Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Enter code here..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={styles.textInput}
          />
        </View>

        {/* Join Button */}
        <TouchableOpacity
          onPress={handleJoin}
          disabled={joinMutation.isPending}
          style={styles.joinBtn}
        >
          {joinMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.joinBtnText}>
                Join Group
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Help Text */}
        <View style={styles.helpCard}>
          <View style={{ flexDirection: "row", marginBottom: 8 }}>
            <Ionicons
              name="information-circle"
              size={20}
              color={colors.primary}
              style={{ marginRight: 8 }}
            />
            <Text style={{ flex: 1, fontSize: 14, fontWeight: "600", color: colors.text }}>
              How to get an invite code?
            </Text>
          </View>
          <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>
            Ask a group member to share the invite code with you. They can find
            it by opening the group and tapping the "Invite" button.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
