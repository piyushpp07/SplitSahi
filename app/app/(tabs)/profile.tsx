import { View, Text, TouchableOpacity, Alert, ScrollView, Share, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "@/lib/api";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { colors, isDark } = useTheme();

  async function handleLogout() {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  async function handleExport() {
    try {
      const res = await apiGet<{ activities: any[] }>("/activity");
      
      let csv = "Date,Type,Description,Amount\n";
      res.activities.forEach(a => {
         const date = new Date(a.createdAt).toLocaleDateString();
         const type = a.type === "expense" ? "Expense" : "Payment";
         const desc = a.type === "expense" ? a.data.title : `Paid to ${a.data.toUser?.name}`;
         const amount = a.type === "expense" ? a.data.totalAmount : a.data.amount;
         csv += `${date},${type},"${desc}",${amount}\n`;
      });
      
      // Use cacheDirectory for temporary files to share
      const directory = (FileSystem as any).cacheDirectory;
      
      if (!directory) {
        // Fallback: Share as text if storage not available
        await Share.share({
          message: csv,
          title: "SplitSahiSe Export",
        });
        return;
      }
      
      const path = directory + "splitsahise_export.csv";
      await FileSystem.writeAsStringAsync(path, csv, { encoding: 'utf8' });
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Transaction Data',
          UTI: 'public.comma-separated-values-text' // for iOS
        });
      } else {
        // Fallback: Share as text if sharing not available
        await Share.share({
            message: csv,
            title: "SplitSahiSe Export",
        });
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export data: " + (e instanceof Error ? e.message : String(e)));
    }
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 32,
    },
    avatar: {
      height: 96,
      width: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
      borderWidth: 4,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    avatarText: {
      fontSize: 36,
      fontWeight: 'bold',
      color: colors.primary,
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    email: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    editBtn: {
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    editBtnText: {
      color: colors.textSecondary,
      fontWeight: 'bold',
      fontSize: 12,
      marginLeft: 8,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      color: colors.textSecondary,
      fontSize: 10,
      fontWeight: 'bold',
      letterSpacing: 2,
      marginBottom: 16,
      textTransform: 'uppercase',
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoIcon: {
      height: 40,
      width: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    infoLabel: {
      color: colors.textTertiary,
      fontSize: 12,
      marginBottom: 4,
      fontWeight: 'bold',
    },
    infoValue: {
      color: colors.text,
      fontWeight: 'bold',
      fontSize: 14,
    },
    menuContainer: {
      gap: 12,
    },
    menuItem: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuIcon: {
      height: 40,
      width: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceActive,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    menuText: {
      color: colors.text,
      fontWeight: 'bold',
      flex: 1,
    }
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user as any)?.emoji || user?.name?.charAt(0).toUpperCase() || "U"}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name ?? "User"}</Text>
          <Text style={[styles.email, { marginBottom: 4 }]}>@{user?.username ?? "username"}</Text>
          <Text style={styles.email}>{user?.email ?? "user@example.com"}</Text>
          
          <TouchableOpacity 
            onPress={() => router.push("/edit-profile")}
            style={styles.editBtn}
          >
            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Details</Text>
          
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="at-outline" size={18} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Username</Text>
              <Text style={styles.infoValue}>@{user?.username || "Not set"}</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Ionicons name="call-outline" size={18} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={styles.infoLabel}>Phone Number</Text>
              <Text style={styles.infoValue}>{user?.phone || "Not set"}</Text>
            </View>
          </View>
          
          <View style={[styles.infoRow, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
            <View style={styles.infoIcon}>
              <Ionicons name="card-outline" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoLabel}>UPI ID</Text>
              <Text style={[styles.infoValue, { color: colors.primary }]} numberOfLines={1}>
                {user?.upiId || "Not connected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.menuContainer}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push("/friends")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuText}>My Friends</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push("/preferences")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="settings-outline" size={20} color={colors.info} />
            </View>
            <Text style={styles.menuText}>Settings</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleExport}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="download-outline" size={20} color={colors.success} />
            </View>
            <Text style={styles.menuText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Legal</Text>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push("/legal/privacy")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push("/legal/terms")}
          >
            <View style={styles.menuIcon}>
              <Ionicons name="document-text-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.menuText}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.menuItem, { backgroundColor: colors.errorLight, borderColor: colors.errorLight, marginTop: 12 }]}
            onPress={handleLogout}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <Ionicons name="log-out-outline" size={20} color={colors.error} />
            </View>
            <Text style={[styles.menuText, { color: colors.error }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
