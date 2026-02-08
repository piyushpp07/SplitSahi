import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiPatch } from "@/lib/api";
import { router } from "expo-router";
import { useAuthStore } from "@/store/authStore";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [upiId, setUpiId] = useState(user?.upiId || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter your name");
      return;
    }
    
    if (upiId.trim() && !/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId.trim())) {
      Alert.alert("Invalid UPI ID", "Please enter a valid UPI ID (e.g. user@bank)");
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
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-5"
      >
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Edit Profile</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold mb-2">Full Name</Text>
              <TextInput
                className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
                value={name}
                onChangeText={setName}
                placeholder="e.g. John Doe"
                placeholderTextColor="#475569"
              />
            </View>
            
            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold mb-2">UPI ID</Text>
              <TextInput
                className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
                value={upiId}
                onChangeText={setUpiId}
                placeholder="user@upi"
                placeholderTextColor="#475569"
                autoCapitalize="none"
              />
              <Text className="text-slate-600 text-[10px] mt-1 ml-1">Used for receiving payments</Text>
            </View>

            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold mb-2">Phone Number</Text>
              <TextInput
                className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
                value={phone}
                onChangeText={setPhone}
                placeholder="+91 98765 43210"
                placeholderTextColor="#475569"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center mb-10 ${loading ? 'bg-slate-800' : 'bg-primary'}`}
            onPress={handleUpdate}
            disabled={loading}
          >
            <Text className="text-[#020617] font-bold text-base">
              {loading ? "Saving..." : "Save Changes"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
