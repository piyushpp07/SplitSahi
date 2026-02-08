import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, ActivityIndicator, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function AddFriendScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  async function searchUsers(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      // Assuming this endpoint exists or will handle q parameter
      const users = await apiGet<User[]>(`/users/search?q=${encodeURIComponent(text)}`);
      setResults(users);
    } catch (e) {
      console.log(e);
      // Fallback or empty if not found
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function addFriend(friendId: string) {
    setAddingId(friendId);
    try {
      await apiPost("/friendships", { friendId });
      Alert.alert("Success", "Friend added successfully!");
      router.replace("/friends");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to add friend");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 px-5"
      >
        {/* Header */}
        <View className="flex-row items-center mb-6 mt-4">
          <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-800 rounded-xl items-center justify-center mr-4">
            <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Add Friend</Text>
        </View>

        {/* Search Input */}
        <View className="mb-6">
          <View className="bg-slate-900 rounded-xl border border-slate-800 p-1 flex-row items-center">
            <View className="h-10 w-10 items-center justify-center ml-2">
              <Ionicons name="search" size={20} color="#64748b" />
            </View>
            <TextInput
              className="flex-1 px-3 py-3 text-white "
              placeholder="Search by name or email"
              placeholderTextColor="#475569"
              value={query}
              onChangeText={searchUsers}
              autoFocus
              autoCapitalize="none"
            />
          </View>
        </View>

        {loading && <ActivityIndicator color="#38bdf8" className="mb-4" />}

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="bg-slate-900/50 rounded-xl p-4 flex-row items-center mb-3 border border-slate-800">
              <View className="h-10 w-10 rounded-full bg-slate-800 items-center justify-center mr-3">
                <Text className="text-sm font-bold text-white">{item.name[0]}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm">{item.name}</Text>
                <Text className="text-slate-500 text-xs">{item.email}</Text>
              </View>
              <TouchableOpacity
                className={`h-9 px-4 rounded-lg items-center justify-center ${addingId === item.id ? 'bg-slate-800' : 'bg-primary'}`}
                onPress={() => addFriend(item.id)}
                disabled={addingId !== null}
              >
                {addingId === item.id ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-[#020617] font-bold text-xs uppercase">Add</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            !loading && query.length >= 2 ? (
              <View className="items-center mt-10">
                <Text className="text-slate-600 ">No users found</Text>
                <Text className="text-slate-700 text-xs mt-1">Try a different name or email</Text>
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
