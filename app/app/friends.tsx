import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface Friend {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export default function FriendsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: () => apiGet<Friend[]>("/friendships"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => apiDelete(`/friendships/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      Alert.alert("Removed", "Friend removed from your connections.");
    },
    onError: (e) => Alert.alert("Error", e.message),
  });

  function handleRemove(friend: Friend) {
    Alert.alert(
      "Remove Friend",
      `Are you sure you want to remove ${friend.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => removeMutation.mutate(friend.id) }
      ]
    );
  }

  // Filter friends based on search
  const filteredFriends = (friends ?? []).filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#020617] items-center justify-center">
        <ActivityIndicator color="#38bdf8" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#020617]" edges={['top']}>
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="mb-6 mt-4">
          <View className="flex-row items-center justify-between mb-4">
            <TouchableOpacity onPress={() => router.back()} className="h-10 w-10 bg-slate-900 rounded-xl items-center justify-center border border-slate-800">
              <Ionicons name="arrow-back" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => router.push("/new/friend")}
              className="h-10 w-10 bg-primary rounded-xl items-center justify-center"
            >
              <Ionicons name="add" size={22} color="#020617" />
            </TouchableOpacity>
          </View>
          <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-[2px] mb-1">Human Grid</Text>
          <Text className="text-4xl font-bold text-white tracking-tighter italic">Friends</Text>
        </View>

        {/* Search */}
        <View className="bg-slate-900 rounded-2xl border border-slate-800 flex-row items-center px-4 mb-6">
          <Ionicons name="search" size={18} color="#475569" />
          <TextInput
            className="flex-1 px-3 py-3 text-white "
            placeholder="Search friends..."
            placeholderTextColor="#475569"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color="#475569" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filteredFriends}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => router.push(`/friend/${item.id}`)}
              className="bg-slate-900/60 rounded-[24px] p-4 flex-row items-center mb-3 border border-white/5"
              activeOpacity={0.7}
            >
              <View className="h-12 w-12 rounded-2xl bg-slate-800 items-center justify-center mr-4 border border-white/10">
                <Text className="text-lg font-bold text-white">{item.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-sm mb-0.5">{item.name}</Text>
                <Text className="text-slate-500 text-[10px] ">{item.email}</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity 
                  onPress={() => handleRemove(item)}
                  className="h-9 w-9 rounded-xl bg-red-500/10 items-center justify-center mr-2"
                >
                  <Ionicons name="trash-outline" size={16} color="#f87171" />
                </TouchableOpacity>
                <View className="h-9 w-9 rounded-xl bg-slate-800 items-center justify-center">
                  <Ionicons name="chevron-forward" size={16} color="#64748b" />
                </View>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="bg-slate-900/30 rounded-[32px] p-10 border border-dashed border-slate-800 items-center mt-4">
              <View className="bg-slate-800/50 p-5 rounded-full mb-4">
                <Ionicons name="people-outline" size={32} color="#475569" />
              </View>
              <Text className="text-slate-500 font-bold uppercase tracking-widest text-[10px] text-center mb-4">
                {search ? "No friends match your search" : "No friends yet"}
              </Text>
              {!search && (
                <TouchableOpacity 
                  onPress={() => router.push("/new/friend")}
                  className="bg-primary px-6 py-3 rounded-xl"
                >
                  <Text className="text-[#020617] font-bold text-[10px] uppercase tracking-widest">Add Friend</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
