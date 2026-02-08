import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "@/lib/api";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function CreateGroupScreen() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  const toggleFriend = (id: string) => {
    setSelectedFriends(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert("Required", "Please enter a group name");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/groups", {
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedFriends,
      });
      Alert.alert("Success", "Group created successfully!");
      router.replace("/(tabs)/groups");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to create group");
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
          <Text className="text-xl font-bold text-white">New Group</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="mb-6">
            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold mb-2">Group Name</Text>
              <TextInput
                className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
                placeholder="e.g. Goa Trip, Apartment 404"
                placeholderTextColor="#475569"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View className="mb-5">
              <Text className="text-slate-500 text-xs font-bold mb-2">Description (Optional)</Text>
              <TextInput
                className="bg-slate-900 rounded-xl px-4 py-4 text-white  border border-slate-800"
                placeholder="What's this group for?"
                placeholderTextColor="#475569"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-slate-500 text-xs font-bold mb-3">Add Members</Text>
            {isLoading ? (
              <ActivityIndicator color="#38bdf8" />
            ) : friends && friends.length > 0 ? (
              <View className="gap-2">
                {friends.map((item) => {
                  const isSelected = selectedFriends.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleFriend(item.id)}
                      className={`bg-slate-900/50 rounded-xl p-3 flex-row items-center border ${isSelected ? 'border-primary' : 'border-slate-800'}`}
                    >
                      <View className="h-9 w-9 rounded-lg bg-slate-800 items-center justify-center mr-3">
                        <Ionicons name="person" size={16} color="#94a3b8" />
                      </View>
                      <Text className="text-white  flex-1">{item.name}</Text>
                      <View className={`h-6 w-6 rounded-full items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'border-slate-700'}`}>
                        {isSelected && <Ionicons name="checkmark" size={14} color="#020617" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View className="bg-slate-900/50 rounded-xl p-6 border border-dashed border-slate-800 items-center">
                <Text className="text-slate-500  text-xs text-center">No friends yet. Add friends to include them in groups.</Text>
                <TouchableOpacity 
                  onPress={() => router.push("/new/friend")}
                  className="mt-3"
                >
                  <Text className="text-primary font-bold text-sm">Add a Friend</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            className={`h-14 rounded-xl items-center justify-center mb-10 shadow-xl ${loading ? 'bg-slate-800' : 'bg-primary'}`}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text className="text-[#020617] font-bold text-base">
              {loading ? "Creating..." : "Create Group"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
