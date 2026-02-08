import { View, Text, TouchableOpacity, Alert, ScrollView, Share } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "@/lib/api";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();

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

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top', 'left', 'right']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View className="items-center mb-10 mt-6">
          <View className="h-24 w-24 rounded-full bg-primary items-center justify-center mb-4 border-4 border-slate-900 shadow-xl">
            <Text className="text-4xl text-[#020617] font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "U"}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-white mb-1">{user?.name ?? "User"}</Text>
          <Text className="text-slate-500 text-sm mb-4">{user?.email ?? "user@example.com"}</Text>
          
          <TouchableOpacity 
            onPress={() => router.push("/edit-profile")}
            className="bg-slate-800 px-5 py-2.5 rounded-xl flex-row items-center border border-slate-700"
          >
            <Ionicons name="pencil" size={14} color="#94a3b8" />
            <Text className="text-slate-300 font-bold text-xs ml-2 uppercase tracking-wide">Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Account Info */}
        <View className="bg-slate-900/50 rounded-2xl p-5 mb-6 border border-slate-800">
          <Text className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-4">Account Details</Text>
          
          <View className="flex-row items-center mb-4 pb-4 border-b border-slate-800/50">
            <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
              <Ionicons name="call-outline" size={18} color="#94a3b8" />
            </View>
            <View>
              <Text className="text-slate-500 text-xs mb-0.5">Phone Number</Text>
              <Text className="text-slate-500 font-bold">{user?.phone || "Not scheduled"}</Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
              <Ionicons name="card-outline" size={18} color="#38bdf8" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-500 text-xs mb-0.5">UPI ID</Text>
              <Text className="text-primary font-bold" numberOfLines={1}>
                {user?.upiId || "Not connected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View className="gap-3">
          <TouchableOpacity 
            className="bg-slate-900/50 rounded-xl p-4 flex-row items-center border border-slate-800"
            onPress={() => router.push("/friends")}
          >
            <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
              <Ionicons name="people-outline" size={20} color="#38bdf8" />
            </View>
            <Text className="text-white font-bold flex-1">My Friends</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-slate-900/50 rounded-xl p-4 flex-row items-center border border-slate-800"
            onPress={() => router.push("/preferences")}
          >
            <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
              <Ionicons name="settings-outline" size={20} color="#818cf8" />
            </View>
            <Text className="text-white font-bold flex-1">Settings</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-slate-900/50 rounded-xl p-4 flex-row items-center border border-slate-800"
            onPress={handleExport}
          >
            <View className="h-10 w-10 rounded-xl bg-slate-800 items-center justify-center mr-4">
              <Ionicons name="download-outline" size={20} color="#10b981" />
            </View>
            <Text className="text-white font-bold flex-1">Export Data</Text>
            <Ionicons name="chevron-forward" size={18} color="#475569" />
          </TouchableOpacity>

          <TouchableOpacity 
            className="bg-red-500/10 rounded-xl p-4 flex-row items-center mt-4 border border-red-500/10"
            onPress={handleLogout}
          >
            <View className="h-10 w-10 rounded-xl bg-red-500/10 items-center justify-center mr-4">
              <Ionicons name="log-out-outline" size={20} color="#f87171" />
            </View>
            <Text className="text-red-400 font-bold flex-1">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
