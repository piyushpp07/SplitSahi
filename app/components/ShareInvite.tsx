import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Share,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useTheme } from "@/contexts/ThemeContext";

interface ShareInviteProps {
  groupId: string;
  groupName: string;
  inviteCode?: string;
}

export default function ShareInvite({
  groupId,
  groupName,
  inviteCode,
}: ShareInviteProps) {
  const { colors, isDark } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  // Generate invite link
  const inviteLink = `splitsahise://group/join/${groupId}`;
  const inviteMessage = `Join "${groupName}" on SplitSahiSe!\n\n${
    inviteCode ? `Invite Code: ${inviteCode}\n` : ""
  }${inviteLink}`;

  async function handleShare() {
    try {
      const result = await Share.share({
        message: inviteMessage,
        title: `Join ${groupName}`,
        ...(Platform.OS === "ios" && { url: inviteLink }),
      });

      if (result.action === Share.sharedAction) {
        setModalVisible(false);
        Alert.alert("Success", "Invite shared successfully!");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to share invite");
    }
  }

  async function copyToClipboard(text: string, label: string) {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied!", `${label} copied to clipboard`);
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.primary,
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderRadius: 12,
        }}
      >
        <Ionicons name="share-social" size={20} color="#FFFFFF" />
        <Text
          style={{
            marginLeft: 8,
            fontSize: 16,
            fontWeight: "600",
            color: "#FFFFFF",
          }}
        >
          Invite
        </Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 20,
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 24,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                <Ionicons
                  name="people"
                  size={24}
                  color={colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "bold",
                    color: colors.text,
                  }}
                >
                  Invite to {groupName}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: colors.textSecondary,
                    marginTop: 2,
                  }}
                >
                  Share this group with friends
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Invite Code */}
            {inviteCode && (
              <View
                style={{
                  backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E5E7EB",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.textSecondary,
                    marginBottom: 8,
                    fontWeight: "600",
                  }}
                >
                  INVITE CODE
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      color: colors.primary,
                      letterSpacing: 4,
                    }}
                  >
                    {inviteCode}
                  </Text>
                  <TouchableOpacity
                    onPress={() => copyToClipboard(inviteCode, "Invite code")}
                    style={{
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Ionicons name="copy" size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Share Options */}
            <View style={{ gap: 12 }}>
              {/* Share via Apps */}
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.primary,
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 12,
                }}
              >
                <Ionicons name="share-social" size={24} color="#FFFFFF" />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFFFFF",
                  }}
                >
                  Share Invite
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Copy Link */}
              <TouchableOpacity
                onPress={() => copyToClipboard(inviteLink, "Invite link")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E5E7EB",
                }}
              >
                <Ionicons name="link" size={24} color={colors.primary} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Copy Link
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {/* Copy Message */}
              <TouchableOpacity
                onPress={() => copyToClipboard(inviteMessage, "Invite message")}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: isDark ? "#1e293b" : "#F3F4F6",
                  paddingHorizontal: 20,
                  paddingVertical: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: isDark ? "#334155" : "#E5E7EB",
                }}
              >
                <Ionicons name="chatbubbles" size={24} color={colors.primary} />
                <Text
                  style={{
                    flex: 1,
                    marginLeft: 12,
                    fontSize: 16,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                >
                  Copy Message
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* Cancel */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                marginTop: 16,
                paddingVertical: 16,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: colors.textSecondary,
                }}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
